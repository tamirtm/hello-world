import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { c, TAP } from './theme';

export function Button(props: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary';
  disabled?: boolean;
  testID?: string;
}) {
  const primary = props.kind !== 'secondary';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!props.disabled }}
      disabled={props.disabled}
      onPress={props.onPress}
      testID={props.testID}
      style={({ pressed }) => [
        s.button,
        primary ? s.buttonPrimary : s.buttonSecondary,
        props.disabled && s.disabled,
        pressed && s.pressed,
      ]}
    >
      <Text style={[s.buttonText, primary ? s.buttonTextPrimary : s.buttonTextSecondary]}>{props.label}</Text>
    </Pressable>
  );
}

export function Chip(props: { label: string; selected: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: props.selected }}
      onPress={props.onPress}
      testID={props.testID}
      style={({ pressed }) => [s.chip, props.selected && s.chipOn, pressed && s.pressed]}
    >
      <Text style={[s.chipText, props.selected && s.chipTextOn]}>{props.label}</Text>
    </Pressable>
  );
}

export function Field(props: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  maxLength: number;
  error?: string;
  testID?: string;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor="#6b7390"
        maxLength={props.maxLength}
        autoCorrect={false}
        testID={props.testID}
        style={[s.input, !!props.error && s.inputError]}
      />
      {props.error ? (
        <Text style={s.error} accessibilityLiveRegion="polite" testID={props.testID ? `${props.testID}-error` : undefined}>
          {props.error}
        </Text>
      ) : null}
    </View>
  );
}

function words(pct: number): string {
  if (pct <= 5) return 'Almost no chance';
  if (pct <= 20) return 'Long shot';
  if (pct <= 40) return 'Unlikely';
  if (pct < 50) return 'A bit less than a coin flip';
  if (pct === 50) return 'Coin flip';
  if (pct < 60) return 'A bit better than a coin flip';
  if (pct < 80) return 'Likely';
  if (pct < 95) return 'Very likely';
  return 'Almost certain';
}

/** 1% to 99% in whole steps. Slider for speed, -/+ for precision with one thumb. */
export function LikelihoodPicker(props: { value: number; onChange: (pct: number) => void }) {
  const set = (v: number) => props.onChange(Math.min(99, Math.max(1, Math.round(v))));
  return (
    <View style={s.picker}>
      <Text style={s.pct} testID="pct">{props.value}%</Text>
      <Text style={s.pctWords}>{words(props.value)}</Text>
      <Slider
        testID="slider"
        accessibilityLabel="How likely, in percent"
        style={s.slider}
        minimumValue={1}
        maximumValue={99}
        step={1}
        value={props.value}
        onValueChange={set}
        minimumTrackTintColor={c.accent}
        maximumTrackTintColor={c.border}
        thumbTintColor={c.accent}
      />
      <View style={s.nudges}>
        {[-10, -1, 1, 10].map((d) => (
          <Pressable
            key={d}
            accessibilityRole="button"
            accessibilityLabel={`${d > 0 ? 'Add' : 'Subtract'} ${Math.abs(d)} percent`}
            onPress={() => set(props.value + d)}
            testID={`nudge${d}`}
            style={({ pressed }) => [s.nudge, pressed && s.pressed]}
          >
            <Text style={s.nudgeText}>{d > 0 ? `+${d}` : `−${Math.abs(d)}`}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  button: { minHeight: TAP + 4, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  buttonPrimary: { backgroundColor: c.accent },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.border },
  buttonText: { fontSize: 19, fontWeight: '700', textAlign: 'center' },
  buttonTextPrimary: { color: c.onAccent },
  buttonTextSecondary: { color: c.text },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.7 },
  chip: { minHeight: TAP, paddingHorizontal: 18, borderRadius: TAP / 2, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.panel, justifyContent: 'center' },
  chipOn: { borderColor: c.accent, backgroundColor: c.panelHi },
  chipText: { color: c.muted, fontSize: 17, fontWeight: '600' },
  chipTextOn: { color: c.text },
  field: { gap: 6 },
  fieldLabel: { color: c.muted, fontSize: 15 },
  input: { minHeight: TAP, borderRadius: 14, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.panel, color: c.text, fontSize: 18, paddingHorizontal: 16 },
  inputError: { borderColor: c.warn },
  error: { color: c.warn, fontSize: 15 },
  picker: { alignItems: 'center', gap: 4 },
  pct: { color: c.text, fontSize: 76, fontWeight: '800', fontVariant: ['tabular-nums'] },
  pctWords: { color: c.muted, fontSize: 18, marginBottom: 12 },
  slider: { width: '100%', height: TAP },
  nudges: { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  nudge: { flex: 1, minHeight: TAP, borderRadius: 14, backgroundColor: c.panel, borderWidth: 1.5, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  nudgeText: { color: c.text, fontSize: 19, fontWeight: '700' },
});
