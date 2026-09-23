import { useEffect, useCallback, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import { useMobileDictation } from '../hooks/use-mobile-dictation'
import { triggerError } from '../platform/haptics'
import {
  appendBufferedDictation,
  routeDictationTranscript
} from '../terminal/terminal-live-dictation-routing'
import {
  fetchDictationSetup,
  isDictationSetupRequiredError
} from '../dictation/mobile-dictation-setup'
import { useMobileNativeChatController } from './use-mobile-native-chat-controller'
import { useMobileNativeChatReadability } from './use-mobile-native-chat-readability'
import { useMobileNativeChatInputLease } from './use-mobile-native-chat-input-lease'
import { useMobileNativeChatSendError } from './use-mobile-native-chat-send-error'
import { mobileNativeChatScopeKey } from './mobile-native-chat-scope-key'
import { useMobileSendCompletionGeneration } from './use-mobile-send-completion-generation'
import { useFloatingVoiceButtonSessionSettings } from './use-floating-voice-button-settings'
import { shouldAutoSendDictation } from './floating-voice-button-geometry'
import type { MobileSessionFeedbackCapabilitiesModel } from './use-mobile-session-feedback-capabilities'

export function useMobileSessionNativeChatDictation(
  scope: MobileSessionFeedbackCapabilitiesModel,
  sendLiveTerminalInput: (handle: string, bytes: string) => Promise<boolean>,
  sendBufferedTerminalInput: (text: string) => Promise<void>
) {
  const {
    hostId,
    worktreeId,
    client,
    connState,
    agentSessionPromptCancelSupported,
    input,
    setInput,
    liveInputTerminalHandles,
    activeHandle,
    activeSessionTabId,
    diffComments,
    diffCommentsRef,
    setShowDictationSetup,
    setDictationMode,
    deviceTokenRef,
    dictationRouteContextRef,
    activeHandleRef,
    activeSessionTab,
    flushPendingLiveInputBeforeExternalSend,
    canSend,
    liveInputEnabled,
    showToast,
    resetLiveInputFocus
  } = scope
  // Chat UI's own Settings screen writes this via useFloatingVoiceButtonSettingsScreenState;
  // re-read on focus like the rest of the floating-voice prefs (useMobileSessionFloatingVoice
  // reads the same AsyncStorage key independently — this hook runs earlier in the
  // controller's hook chain and can't take that hook's output as a plain argument).
  const { autoSend: floatingVoiceAutoSend } = useFloatingVoiceButtonSessionSettings()
  // Latest rendered drafts, for building the auto-sent text synchronously in onTranscript.
  const bufferedInputRef = useRef(input)
  bufferedInputRef.current = input
  const chatComposerTextRef = useRef('')
  const nativeChatScopeKey = mobileNativeChatScopeKey(hostId, worktreeId, activeSessionTabId)
  const nativeChatSendError = useMobileNativeChatSendError({
    scopeKey: nativeChatScopeKey,
    showToast
  })
  const nativeChatTranscriptIsLocalReadable = useMobileNativeChatReadability(client, worktreeId)
  const {
    ready: nativeChatInputLeaseReady,
    readyRef: nativeChatInputLeaseReadyRef,
    lockReason: nativeChatInputLockReason,
    markReady: markNativeChatInputLeaseReady,
    clear: clearNativeChatInputLease
  } = useMobileNativeChatInputLease({
    activeHandle,
    connected: connState === 'connected'
  })
  const nativeChatController = useMobileNativeChatController({
    client,
    hostId,
    worktreeId,
    activeSessionTab,
    activeSessionTabId,
    activeHandleRef,
    deviceTokenRef,
    nativeChatTranscriptIsLocalReadable,
    nativeChatInputLeaseReady,
    connState,
    agentSessionPromptCancelSupported,
    onSendError: nativeChatSendError.show,
    onSendResolved: nativeChatSendError.clear
  })
  chatComposerTextRef.current = nativeChatController.chatComposerText
  const { toggleTabChatView, showNativeChat, showNativeChatRef } = nativeChatController
  nativeChatSendError.bannerMountedRef.current = showNativeChat
  const nativeChatOverlayInputLockReason =
    activeSessionTab?.type === 'agent-session'
      ? connState === 'connected'
        ? null
        : 'disconnected'
      : nativeChatInputLockReason
  const routeKey = nativeChatScopeKey ?? `${hostId}\0${worktreeId}`
  const getSendCompletionGeneration = useMobileSendCompletionGeneration({
    onBlur: resetLiveInputFocus,
    surfaceKey: JSON.stringify([routeKey, activeHandle, showNativeChat, liveInputEnabled])
  })

  /**
   * One policy for every dictation failure, whichever entry point sees it: `onError` for a
   * dictation already underway, `start`'s rejection for the tap that never got one. Written twice,
   * only the first knew about the setup sheet, so a desktop refusing the start with
   * `voice_dictation_disabled` showed the user that code as a toast.
   */
  const reportDictationFailure = useCallback(
    (err: unknown) => {
      const message = err instanceof Error ? err.message : String(err)
      // Dictation not set up on desktop → open the setup sheet instead of a dead-end toast.
      if (isDictationSetupRequiredError(message)) {
        setShowDictationSetup(true)
        return
      }
      triggerError()
      showToast(message)
    },
    [setShowDictationSetup, showToast]
  )

  const dictation = useMobileDictation({
    client,
    enabled: canSend,
    onTranscript: (text) => {
      const autoSend = shouldAutoSendDictation(floatingVoiceAutoSend, text)
      // Why: dictation belongs to the visible composer — native chat consumes it locally, terminal mode keeps live-input routing.
      if (showNativeChatRef.current) {
        // Why a ref, not a value captured inside the setState updater: React may run updaters
        // lazily at the next render, which would auto-send the transcript without the draft.
        const composed = appendBufferedDictation(chatComposerTextRef.current, text)
        chatComposerTextRef.current = composed
        nativeChatController.setChatComposerText(composed)
        if (autoSend) {
          void nativeChatController.handleNativeChatSend(composed)
        } else {
          showToast('Dictation inserted')
        }
        return
      }
      // Live mode inserts the transcript into its PTY as text (no Return); buffered mode appends to the command field.
      const routeContext = dictationRouteContextRef.current
      dictationRouteContextRef.current = null
      const route = routeDictationTranscript(
        text,
        routeContext?.liveInputEnabled ?? liveInputEnabled
      )
      if (route.kind === 'live-insert') {
        const insertHandle = routeContext?.handle ?? activeHandleRef.current
        if (!insertHandle) {
          return
        }
        void (async () => {
          const flushedPendingInput = await flushPendingLiveInputBeforeExternalSend(insertHandle)
          if (!flushedPendingInput) {
            return
          }
          const sent = await sendLiveTerminalInput(insertHandle, route.text)
          if (!sent) {
            return
          }
          if (autoSend) {
            // Text is already typed into the live PTY input — Send there just
            // means "submit the line", which live terminal input does with a
            // raw Enter byte (see use-terminal-live-input-commit.ts's own
            // handleLiveInputSubmit), so reuse that exact mechanism.
            void sendLiveTerminalInput(insertHandle, '\r')
          } else {
            showToast('Dictation inserted')
          }
        })()
        return
      }
      const composedBufferedDraft = appendBufferedDictation(bufferedInputRef.current, route.text)
      bufferedInputRef.current = composedBufferedDraft
      setInput(composedBufferedDraft)
      if (autoSend) {
        // handleSend (bridged via sendBufferedTerminalInput) clears the draft
        // itself and sends with Enter — the setInput above still runs so a
        // rejected send has the right text to restore into the field.
        void sendBufferedTerminalInput(composedBufferedDraft)
      } else {
        showToast('Dictation inserted')
      }
    },
    onError: (err) => {
      dictationRouteContextRef.current = null
      reportDictationFailure(err)
    }
  })

  const startDictation = useCallback(() => {
    const routeContext = activeHandle
      ? { handle: activeHandle, liveInputEnabled: liveInputTerminalHandles.has(activeHandle) }
      : null
    dictationRouteContextRef.current = routeContext
    void dictation.start().catch((err) => {
      if (dictationRouteContextRef.current === routeContext) {
        dictationRouteContextRef.current = null
      }
      reportDictationFailure(err)
    })
  }, [activeHandle, dictation, liveInputTerminalHandles, reportDictationFailure])

  const cancelDictation = useCallback(() => {
    dictationRouteContextRef.current = null
    void dictation.cancel()
  }, [dictation])

  // Toggle mode: one tap starts, the next stops; long-press cancels mid-record.
  const handleDictationToggle = useCallback(() => {
    if (dictation.isProcessing) {
      cancelDictation()
    } else if (dictation.isStarting) {
      // The start request is still settling; a second toggle is intentionally ignored.
    } else if (dictation.isRecording) {
      void dictation.stop()
    } else {
      startDictation()
    }
  }, [cancelDictation, dictation, startDictation])

  // Hold mode: press starts, release stops — like a walkie-talkie.
  const handleDictationPressIn = useCallback(() => {
    if (!dictation.isStarting && !dictation.isRecording && !dictation.isProcessing) {
      startDictation()
    }
  }, [dictation, startDictation])

  const handleDictationPressOut = useCallback(() => {
    if (dictation.isRecording) {
      void dictation.stop()
    } else if (dictation.isStarting) {
      // Released before recording began: cancel so we don't leave a live mic.
      cancelDictation()
    }
  }, [cancelDictation, dictation])

  const refreshDictationMode = useCallback(async () => {
    if (!client) {
      return
    }
    try {
      const setup = await fetchDictationSetup(client)
      setDictationMode(setup.dictationMode)
    } catch {
      // Non-fatal: fall back to the default toggle behavior.
    }
  }, [client])

  // Re-read on focus so a Settings ▸ Voice dictation-mode change is reflected on return.
  useFocusEffect(
    useCallback(() => {
      void refreshDictationMode()
    }, [refreshDictationMode])
  )

  useEffect(() => {
    diffCommentsRef.current = diffComments
  }, [diffComments])
  return {
    nativeChatScopeKey,
    nativeChatSendError,
    nativeChatTranscriptIsLocalReadable,
    nativeChatInputLeaseReady,
    nativeChatInputLeaseReadyRef,
    nativeChatInputLockReason,
    nativeChatOverlayInputLockReason,
    markNativeChatInputLeaseReady,
    clearNativeChatInputLease,
    nativeChatController,
    getSendCompletionGeneration,
    toggleTabChatView,
    showNativeChat,
    showNativeChatRef,
    chatInputSendable: nativeChatController.chatInputSendable,
    dictation,
    startDictation,
    cancelDictation,
    handleDictationToggle,
    handleDictationPressIn,
    handleDictationPressOut,
    refreshDictationMode
  }
}

export type MobileSessionNativeChatDictationModel = MobileSessionFeedbackCapabilitiesModel &
  ReturnType<typeof useMobileSessionNativeChatDictation>
