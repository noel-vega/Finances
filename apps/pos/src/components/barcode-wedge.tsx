import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

const MIN_LENGTH = 3;
// a scanner gun types the whole code in a sub-10ms burst then (almost always)
// sends Enter. This idle gap is only a fallback for a gun with no Enter
// suffix — kept well above any real inter-key delay so a laggy emulator
// doesn't split one scan into partial lookups
const IDLE_MS = 250;

/**
 * Invisible, always-focused input that turns a hardware barcode scanner
 * (which acts as a keyboard) into an onScan callback — the RN-native
 * equivalent of merchant-web's `useBarcodeScanner` window keydown listener.
 * Mount it on a screen where scanning should silently add to the order,
 * instead of opening the camera.
 *
 * Pass `enabled={false}` while another field on the screen needs the keyboard
 * (e.g. the search box) so the wedge doesn't steal focus back from it.
 */
export function BarcodeWedge({
  onScan,
  enabled = true,
}: {
  onScan: (code: string) => void;
  enabled?: boolean;
}) {
  const ref = useRef<TextInput>(null);
  const [value, setValue] = useState('');
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // only hold focus while this screen is the active one — don't fight a
  // pushed modal (e.g. checkout) for it
  const screenFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      screenFocused.current = true;
      return () => {
        screenFocused.current = false;
      };
    }, []),
  );

  // grab focus on mount / when re-enabled; release it when disabled
  useEffect(() => {
    if (enabled) {
      const id = setTimeout(() => ref.current?.focus(), 0);
      return () => clearTimeout(id);
    }
    ref.current?.blur();
  }, [enabled]);

  const fire = useCallback(
    (raw: string) => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      setValue('');
      const code = raw.trim();
      if (code.length >= MIN_LENGTH) onScan(code);
    },
    [onScan],
  );

  return (
    <TextInput
      ref={ref}
      style={styles.hidden}
      submitBehavior="submit"
      caretHidden
      contextMenuHidden
      showSoftInputOnFocus={false}
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      value={value}
      onBlur={() => {
        if (enabled && screenFocused.current) {
          setTimeout(() => ref.current?.focus(), 0);
        }
      }}
      onChangeText={(text) => {
        setValue(text);
        if (idleTimer.current) clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => fire(text), IDLE_MS);
      }}
      onSubmitEditing={({ nativeEvent }) => fire(nativeEvent.text)}
    />
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
