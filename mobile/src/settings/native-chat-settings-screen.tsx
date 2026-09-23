import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Switch } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { colors, radii, spacing, typography } from '../theme/mobile-theme'
import { useMobileDefaultSessionViewPreference } from '../session/use-mobile-default-session-view-preference'
import { useFloatingVoiceButtonSettingsScreenState } from '../session/use-floating-voice-button-settings'
import {
  FLOATING_VOICE_BUTTON_SIZE_OPTIONS,
  type FloatingVoiceButtonSizePercent
} from '../session/floating-voice-button-geometry'
import { PickerModal, type PickerOption } from '../components/PickerModal'

// PickerModal is string-keyed; picker values are the percent as a string,
// mapped back to the numeric percent on select.
type VoiceButtonSizeOptionValue = `${FloatingVoiceButtonSizePercent}`

const VOICE_BUTTON_SIZE_OPTIONS: PickerOption<VoiceButtonSizeOptionValue>[] =
  FLOATING_VOICE_BUTTON_SIZE_OPTIONS.map((percent) => ({
    value: `${percent}` as VoiceButtonSizeOptionValue,
    label: percent === 200 ? `${percent}% (default)` : `${percent}%`
  }))

export default function NativeChatSettingsScreen({ onBack }: { onBack?: () => void }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { defaultView, setDefaultView } = useMobileDefaultSessionViewPreference()
  const chatDefault = defaultView === 'chat'

  const {
    enabled: floatingVoiceEnabled,
    sizePercent: floatingVoiceSizePercent,
    setEnabled: setFloatingVoiceEnabled,
    setSizePercent: setFloatingVoiceSizePercent
  } = useFloatingVoiceButtonSettingsScreenState()
  const [showSizePicker, setShowSizePicker] = useState(false)

  return (
    <GestureHandlerRootView style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backButton}
          onPress={onBack ?? (() => router.back())}
        >
          <ChevronLeft size={22} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.heading}>Chat UI</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.groupHeading}>DEFAULT VIEW</Text>
        <Text style={styles.groupDescription}>
          Choose how supported agent sessions (Claude, Codex, and other chat-capable agents) open on
          this device. Terminal shows the raw CLI; Chat UI shows a chat interface like the desktop
          app. You can still switch any individual session from its long-press menu.
        </Text>
        <View style={[styles.section, styles.sectionTopGap]}>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Open sessions in Chat UI</Text>
              <Text style={styles.rowSublabel}>{chatDefault ? 'On' : 'Off'}</Text>
            </View>
            <Switch
              accessibilityLabel="Open sessions in Chat UI"
              value={chatDefault}
              onValueChange={(next) => setDefaultView(next ? 'chat' : 'terminal')}
              trackColor={{ false: colors.bgRaised, true: colors.textSecondary }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>

        <Text style={[styles.groupHeading, styles.sectionTopGap]}>VOICE BUTTON</Text>
        <Text style={styles.groupDescription}>
          A floating mic button hovers over the terminal and Chat UI screens and can be dragged
          anywhere. Turn it off to use the mic button built into the input bar instead.
        </Text>
        <View style={[styles.section, styles.sectionTopGap]}>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Floating mic button</Text>
              <Text style={styles.rowSublabel}>{floatingVoiceEnabled ? 'On' : 'Off'}</Text>
            </View>
            <Switch
              accessibilityLabel="Floating mic button"
              value={floatingVoiceEnabled}
              onValueChange={setFloatingVoiceEnabled}
              trackColor={{ false: colors.bgRaised, true: colors.textSecondary }}
              thumbColor={colors.textPrimary}
            />
          </View>
          <Pressable
            style={[styles.row, styles.rowDivider]}
            disabled={!floatingVoiceEnabled}
            onPress={() => setShowSizePicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Button size"
          >
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, !floatingVoiceEnabled && styles.rowLabelDisabled]}>
                Button size
              </Text>
              <Text style={styles.rowSublabel}>{floatingVoiceSizePercent}%</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      </ScrollView>

      <PickerModal<VoiceButtonSizeOptionValue>
        visible={showSizePicker}
        title="Button size"
        options={VOICE_BUTTON_SIZE_OPTIONS}
        selected={`${floatingVoiceSizePercent}` as VoiceButtonSizeOptionValue}
        onSelect={(value) =>
          setFloatingVoiceSizePercent(Number(value) as FloatingVoiceButtonSizePercent)
        }
        onClose={() => setShowSizePicker(false)}
      />
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    paddingHorizontal: spacing.lg
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary
  },
  groupHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs
  },
  groupDescription: {
    fontSize: typography.bodySize - 1,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: spacing.xs
  },
  section: {
    backgroundColor: colors.bgPanel,
    borderRadius: radii.card,
    overflow: 'hidden'
  },
  sectionTopGap: {
    marginTop: spacing.sm
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2
  },
  rowContent: {
    flex: 1
  },
  rowLabel: {
    fontSize: typography.bodySize,
    fontWeight: '500',
    color: colors.textPrimary
  },
  rowSublabel: {
    fontSize: typography.bodySize - 2,
    color: colors.textSecondary,
    marginTop: 2
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle
  },
  rowLabelDisabled: {
    color: colors.textMuted
  }
})
