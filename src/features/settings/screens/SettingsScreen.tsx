import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, StyleSheet, Switch, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/AppText';
import { BottomSheet } from '../../../components/BottomSheet';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ChevronRightIcon, PencilIcon } from '../../../components/icons';
import { Input } from '../../../components/Input';
import { useConfirm } from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/Toast';
import { CURRENCIES } from '../../../constants/currencies';
import { useAppSelector } from '../../../hooks/redux';
import { appLock } from '../../../services/appLock';
import { signOutGoogle } from '../../../services/googleAuth';
import {
  disablePush,
  isPushEnabled,
  registerForPush,
} from '../../../services/pushNotifications';
import {
  disableQuickAdd,
  enableQuickAdd,
  isQuickAddEnabled,
  isQuickAddSupported,
} from '../../../services/quickAddNotification';
import { tokenStorage } from '../../../storage/mmkv';
import { ThemePreference, useTheme } from '../../../theme/ThemeProvider';
import { useLogoutMutation } from '../../auth/authApi';
import {
  useExportDataMutation,
  useImportDataMutation,
  useRegisterFcmTokenMutation,
  useSendTestPushMutation,
  useUpdateProfileMutation,
} from '../userApi';

const THEME_OPTIONS: { label: string; value: ThemePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const PIN_LENGTH = 4;

export function SettingsScreen() {
  const { theme, preference, setPreference } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAppSelector((s) => s.auth.user);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [updateProfile] = useUpdateProfileMutation();
  const [registerFcmToken] = useRegisterFcmTokenMutation();
  const [sendTestPush, { isLoading: isSendingTest }] = useSendTestPushMutation();
  const [exportData, { isLoading: isExporting }] = useExportDataMutation();
  const [importData, { isLoading: isImporting }] = useImportDataMutation();

  // Notification toggles
  const [quickAdd, setQuickAdd] = useState(isQuickAddEnabled());
  const [push, setPush] = useState(isPushEnabled());

  // Security
  const [lockEnabled, setLockEnabled] = useState(appLock.isEnabled());
  const [biometricEnabled, setBiometricEnabled] = useState(appLock.isBiometricEnabled());
  const [biometricInfo, setBiometricInfo] = useState<{ available: boolean; label: string }>({
    available: false,
    label: 'Biometrics',
  });
  const [pinSheetVisible, setPinSheetVisible] = useState(false);
  const [pinStep, setPinStep] = useState<{ first: string | null; value: string }>({ first: null, value: '' });

  // Sheets
  const [currencySheetVisible, setCurrencySheetVisible] = useState(false);
  const [restoreSheetVisible, setRestoreSheetVisible] = useState(false);
  const [restoreJson, setRestoreJson] = useState('');
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    appLock.biometricAvailability().then(setBiometricInfo);
  }, []);

  const toggleQuickAdd = async (value: boolean) => {
    if (!isQuickAddSupported) return;
    if (value) {
      const ok = await enableQuickAdd();
      setQuickAdd(ok);
      showToast(ok ? 'Quick add pinned to your notification panel' : 'Notification permission denied', ok ? 'success' : 'error');
    } else {
      await disableQuickAdd();
      setQuickAdd(false);
    }
  };

  const togglePush = async (value: boolean) => {
    if (value) {
      const result = await registerForPush();
      if (result.ok && result.token) {
        try {
          await registerFcmToken({ token: result.token }).unwrap();
          setPush(true);
          showToast('Push notifications enabled');
        } catch {
          showToast('Could not register this device', 'error');
        }
      } else {
        showToast(result.reason ?? 'Could not enable push', 'error');
      }
    } else {
      disablePush();
      setPush(false);
    }
  };

  const toggleLock = async (value: boolean) => {
    if (value) {
      setPinStep({ first: null, value: '' });
      setPinSheetVisible(true);
    } else {
      const ok = await confirm({
        title: 'Turn off app lock?',
        message: 'Your PIN will be removed.',
        confirmText: 'Turn off',
        destructive: true,
      });
      if (ok) {
        appLock.disable();
        setLockEnabled(false);
        setBiometricEnabled(false);
      }
    }
  };

  const onPinDigit = (digit: string) => {
    const next = pinStep.value + digit;
    if (next.length < PIN_LENGTH) {
      setPinStep((s) => ({ ...s, value: next }));
      return;
    }
    if (pinStep.first === null) {
      setPinStep({ first: next, value: '' });
    } else if (pinStep.first === next) {
      appLock.setPin(next);
      setLockEnabled(true);
      setPinSheetVisible(false);
      showToast('App lock enabled');
    } else {
      setPinStep({ first: null, value: '' });
      showToast('PINs did not match — try again', 'error');
    }
  };

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const ok = await appLock.promptBiometric();
      if (ok) {
        appLock.setBiometricEnabled(true);
        setBiometricEnabled(true);
        showToast(`${biometricInfo.label} unlock enabled`);
      } else {
        showToast(`${biometricInfo.label} verification failed`, 'error');
      }
    } else {
      appLock.setBiometricEnabled(false);
      setBiometricEnabled(false);
    }
  };

  const handleExport = async () => {
    try {
      const bundle = await exportData().unwrap();
      await Share.share(
        Platform.OS === 'ios'
          ? { message: JSON.stringify(bundle, null, 2), title: 'ExpenseFlow backup' }
          : { message: JSON.stringify(bundle, null, 2), title: 'ExpenseFlow backup' },
      );
    } catch {
      showToast('Could not export your data', 'error');
    }
  };

  const handleRestore = async () => {
    try {
      const bundle = JSON.parse(restoreJson);
      const result = await importData(bundle).unwrap();
      setRestoreSheetVisible(false);
      setRestoreJson('');
      showToast(`Restored ${result.expenses} expenses, ${result.income} income entries`);
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      showToast(message ?? 'Invalid backup — paste the exported JSON exactly', 'error');
    }
  };

  const handleTestPush = async () => {
    try {
      const result = await sendTestPush().unwrap();
      showToast(result.sent > 0 ? `Test sent to ${result.sent} device(s)` : 'No devices — Firebase not configured yet', result.sent > 0 ? 'success' : 'error');
    } catch {
      showToast('Test push failed', 'error');
    }
  };

  const handleCurrency = async (code: string) => {
    setCurrencySheetVisible(false);
    try {
      await updateProfile({ currency: code }).unwrap();
      showToast(`Currency set to ${code}`);
    } catch {
      showToast('Could not update currency', 'error');
    }
  };

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === user?.name) {
      setEditProfileVisible(false);
      return;
    }
    try {
      await updateProfile({ name: trimmed }).unwrap();
      showToast('Profile updated');
      setEditProfileVisible(false);
    } catch {
      showToast('Could not update profile', 'error');
    }
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Log out?',
      message: 'You can log back in anytime.',
      confirmText: 'Log out',
      destructive: true,
    });
    if (ok) {
      const refreshToken = tokenStorage.getRefreshToken();
      logout({ refreshToken: refreshToken ?? '' });
      signOutGoogle();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgPage, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingTop: theme.space.l }]}>
        <AppText variant="h1">Settings</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { gap: theme.space.l }]}
      >
        <Pressable
          onPress={() => {
            setEditName(user?.name ?? '');
            setEditProfileVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          style={({ pressed }) => [pressed && styles.dimmed]}
        >
          <Card style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.brandSubtle }]}>
              <AppText variant="h2" tone="brand">
                {(user?.name ?? '?')
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </AppText>
            </View>
            <View style={styles.profileText}>
              <AppText variant="bodyStrong">{user?.name ?? '—'}</AppText>
              <AppText tone="secondary" variant="caption">
                {user?.email ?? '—'}
              </AppText>
            </View>
            <PencilIcon size={18} color={theme.colors.textMuted} />
          </Card>
        </Pressable>

        <Card style={{ gap: theme.space.m }}>
          <AppText variant="label" tone="muted">
            Appearance
          </AppText>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setPreference(opt.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: preference === opt.value }}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: preference === opt.value ? theme.colors.brandPrimary : theme.colors.brandSubtle,
                    borderRadius: theme.radius.m,
                  },
                ]}
              >
                <AppText variant="caption" tone={preference === opt.value ? 'onPrimary' : 'brand'}>
                  {opt.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Card padded={false}>
          <SectionHeader label="Notifications" />
          <SwitchRow
            label="Quick add in notification panel"
            caption={
              isQuickAddSupported
                ? 'Always-visible notification with add buttons'
                : 'Android only — iOS does not allow persistent notifications'
            }
            value={quickAdd}
            disabled={!isQuickAddSupported}
            onValueChange={toggleQuickAdd}
          />
          <Divider />
          <SwitchRow
            label="Push notifications"
            caption="Reminders and alerts via Firebase"
            value={push}
            onValueChange={togglePush}
          />
          {push ? (
            <>
              <Divider />
              <TapRow label="Send test notification" value={isSendingTest ? 'Sending…' : ''} onPress={handleTestPush} />
            </>
          ) : null}
        </Card>

        <Card padded={false}>
          <SectionHeader label="Security" />
          <SwitchRow
            label="App lock (PIN)"
            caption="Require a 4-digit PIN when opening the app"
            value={lockEnabled}
            onValueChange={toggleLock}
          />
          <Divider />
          <SwitchRow
            label={`${biometricInfo.label} unlock`}
            caption={
              !lockEnabled
                ? 'Enable app lock first'
                : biometricInfo.available
                  ? `Unlock with ${biometricInfo.label} instead of your PIN`
                  : 'No biometric sensor available on this device'
            }
            value={biometricEnabled}
            disabled={!lockEnabled || !biometricInfo.available}
            onValueChange={toggleBiometric}
          />
        </Card>

        <Card padded={false}>
          <SectionHeader label="Data" />
          <TapRow label="Currency" value={user?.currency ?? 'INR'} onPress={() => setCurrencySheetVisible(true)} />
          <Divider />
          <TapRow label="Backup — export data" value={isExporting ? 'Exporting…' : 'JSON'} onPress={handleExport} />
          <Divider />
          <TapRow label="Restore from backup" value="" onPress={() => setRestoreSheetVisible(true)} />
        </Card>

        <Pressable
          onPress={handleLogout}
          disabled={isLoggingOut}
          accessibilityRole="button"
          style={[styles.logoutButton, { borderColor: theme.colors.statusCritical, borderRadius: theme.radius.m }]}
        >
          <AppText variant="bodyStrong" tone="critical">
            Log out
          </AppText>
        </Pressable>

        <AppText variant="caption" tone="muted" style={styles.version}>
          ExpenseFlow v1.0.0
        </AppText>
      </ScrollView>

      {/* Edit profile */}
      <BottomSheet visible={editProfileVisible} onClose={() => setEditProfileVisible(false)}>
        <View style={{ gap: theme.space.m, paddingBottom: theme.space.m }}>
          <AppText variant="h2">Edit profile</AppText>
          <Input label="Full name" value={editName} onChangeText={setEditName} autoFocus autoCapitalize="words" />
          <Button title="Save" onPress={handleSaveName} />
        </View>
      </BottomSheet>

      {/* Currency picker */}
      <BottomSheet visible={currencySheetVisible} onClose={() => setCurrencySheetVisible(false)}>
        <View style={{ gap: theme.space.xs, paddingBottom: theme.space.m }}>
          <AppText variant="h2">Currency</AppText>
          {CURRENCIES.map((c) => (
            <Pressable key={c.code} onPress={() => handleCurrency(c.code)} accessibilityRole="button" style={styles.sheetRow}>
              <AppText variant="bodyStrong" style={styles.currencySymbol}>
                {c.symbol}
              </AppText>
              <AppText style={styles.sheetRowLabel}>{c.label}</AppText>
              <AppText tone={user?.currency === c.code ? 'brand' : 'muted'} variant="caption">
                {user?.currency === c.code ? '✓ ' : ''}
                {c.code}
              </AppText>
            </Pressable>
          ))}
        </View>
      </BottomSheet>

      {/* Restore sheet */}
      <BottomSheet visible={restoreSheetVisible} onClose={() => setRestoreSheetVisible(false)}>
        <View style={{ gap: theme.space.m, paddingBottom: theme.space.m }}>
          <AppText variant="h2">Restore from backup</AppText>
          <AppText tone="secondary" variant="caption">
            Paste the JSON you exported earlier. Entries are added to this account.
          </AppText>
          <TextInput
            value={restoreJson}
            onChangeText={setRestoreJson}
            multiline
            placeholder='{"version":1, ...}'
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.restoreInput,
              {
                backgroundColor: theme.colors.bgSurface,
                borderColor: theme.colors.borderHairline,
                borderRadius: theme.radius.m,
                color: theme.colors.textPrimary,
              },
            ]}
            accessibilityLabel="Backup JSON"
          />
          <Button
            title="Restore"
            onPress={handleRestore}
            loading={isImporting}
            disabled={restoreJson.trim().length === 0}
          />
        </View>
      </BottomSheet>

      {/* PIN setup */}
      <BottomSheet
        visible={pinSheetVisible}
        onClose={() => {
          setPinSheetVisible(false);
          setPinStep({ first: null, value: '' });
        }}
      >
        <View style={{ gap: theme.space.m, paddingBottom: theme.space.m, alignItems: 'center' }}>
          <AppText variant="h2">{pinStep.first === null ? 'Set a 4-digit PIN' : 'Confirm your PIN'}</AppText>
          <View style={styles.pinDots}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  { backgroundColor: i < pinStep.value.length ? theme.colors.brandPrimary : theme.colors.borderHairline },
                ]}
              />
            ))}
          </View>
          <View style={styles.pinPad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, i) => (
              <Pressable
                key={i}
                disabled={!key}
                onPress={() =>
                  key === '⌫'
                    ? setPinStep((s) => ({ ...s, value: s.value.slice(0, -1) }))
                    : onPinDigit(key)
                }
                accessibilityRole="button"
                accessibilityLabel={key === '⌫' ? 'Delete' : key}
                style={({ pressed }) => [
                  styles.pinKey,
                  key !== '' && { backgroundColor: pressed ? theme.colors.brandSubtle : theme.colors.bgSurface },
                ]}
              >
                <AppText variant="h2">{key}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <AppText variant="label" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

function SwitchRow({
  label,
  caption,
  value,
  disabled,
  onValueChange,
}: {
  label: string;
  caption?: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.settingsRow, disabled ? styles.dimmed : null]}>
      <View style={styles.rowText}>
        <AppText>{label}</AppText>
        {caption ? (
          <AppText variant="caption" tone="muted">
            {caption}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{
          false: theme.dark ? 'rgba(255,255,255,0.16)' : 'rgba(11,11,15,0.12)',
          true: theme.colors.brandPrimary,
        }}
        // Explicit white thumb — otherwise OEM skins (Samsung One UI) paint
        // their own accent-colored thumb over the brand track.
        thumbColor="#FFFFFF"
        accessibilityLabel={label}
      />
    </View>
  );
}

function TapRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.settingsRow, pressed && styles.dimmed]}>
      <AppText>{label}</AppText>
      <View style={styles.rowValue}>
        {value ? <AppText tone="muted">{value}</AppText> : null}
        <ChevronRightIcon size={18} color={theme.colors.textMuted} />
      </View>
    </Pressable>
  );
}

function Divider() {
  const { theme } = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.colors.borderHairline }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1, gap: 2 },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeOption: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  sectionHeader: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rowText: { flex: 1, gap: 2 },
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dimmed: { opacity: 0.55 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  logoutButton: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    alignItems: 'center',
  },
  version: { textAlign: 'center' },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  sheetRowLabel: { flex: 1 },
  currencySymbol: { width: 34 },
  restoreInput: {
    minHeight: 120,
    maxHeight: 200,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  pinDots: { flexDirection: 'row', gap: 14 },
  pinDot: { width: 14, height: 14, borderRadius: 7 },
  pinPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 264,
    gap: 12,
    justifyContent: 'center',
  },
  pinKey: {
    width: 80,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
