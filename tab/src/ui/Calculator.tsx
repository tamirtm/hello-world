import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatAmerican, formatDecimal, formatPercent, oddsFor, splitTheDifference } from '../odds';
import { describeDeal } from '../deal/describe';
import { STAKE_PRESETS, presetId, type Stake } from '../deal/stakes';
import { TEMPLATES, type TemplateId } from '../deal/templates';
import { checkText } from '../moderation/filter';
import { Button, Chip, Field, LikelihoodPicker } from './controls';
import { confirmAdult, isAdultConfirmed } from './ageGate';
import { c, TAP } from './theme';

type Step = 'age' | 'bet' | 'belief' | 'stake' | 'pass' | 'friend' | 'deal';

const filterError = (text: string, field: 'bet' | 'stake' | 'name') => {
  if (!text.trim()) return undefined;
  const r = checkText(text, field);
  return r.ok ? undefined : r.message;
};

export default function Calculator() {
  const [step, setStep] = useState<Step>(isAdultConfirmed() ? 'bet' : 'age');

  const [nameA, setNameA] = useState('');
  const [nameB, setNameB] = useState('');
  const [templateId, setTemplateId] = useState<TemplateId>('overunder');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [pctA, setPctA] = useState(50);
  const [pctB, setPctB] = useState(50);
  const [stakeId, setStakeId] = useState<string>('drink');
  const [customStake, setCustomStake] = useState('');
  const [swapped, setSwapped] = useState(false);
  const [showMath, setShowMath] = useState(false);

  const template = TEMPLATES.find((t) => t.id === templateId)!;
  const statement = template.compose(a, b);
  const A = nameA.trim() || 'Player 1';
  const B = nameB.trim() || 'Player 2';

  const errors = {
    nameA: filterError(nameA, 'name'),
    nameB: filterError(nameB, 'name'),
    a: filterError(a, 'bet'),
    b: filterError(b, 'bet'),
    stake: filterError(customStake, 'stake'),
  };
  const betReady = !!statement && !errors.nameA && !errors.nameB && !errors.a && !errors.b;

  const stake: Stake | null = useMemo(() => {
    if (stakeId === 'custom') return customStake.trim() ? { kind: 'custom', text: customStake.trim() } : null;
    return STAKE_PRESETS.find((p) => presetId(p) === stakeId) ?? null;
  }, [stakeId, customStake]);
  const stakeReady = !!stake && !(stakeId === 'custom' && errors.stake);

  const reset = () => {
    setA(''); setB(''); setPctA(50); setPctB(50); setStakeId('drink'); setCustomStake('');
    setSwapped(false); setShowMath(false); setStep('bet');
  };

  // ----- screens -----

  if (step === 'age') {
    return (
      <Screen
        title="Tab"
        lead="Friendly bets, fair odds. Settle it for a drink, a coffee or the dishes."
        footer={<Button label="I'm 18 or over" testID="age-yes" onPress={() => { confirmAdult(); setStep('bet'); }} />}
      >
        <Card>
          <Text style={s.body}>Tab is for adults. No money ever changes hands here: stakes are IOUs between friends, nothing more.</Text>
        </Card>
        <Text style={s.small}>If you are under 18, this app is not for you.</Text>
      </Screen>
    );
  }

  if (step === 'bet') {
    return (
      <Screen
        step={1}
        title="What's the bet?"
        footer={<Button label="Next" testID="next" disabled={!betReady} onPress={() => setStep('belief')} />}
      >
        <View style={s.chips}>
          {TEMPLATES.map((t) => (
            <Chip key={t.id} label={t.label} selected={t.id === templateId} testID={`tpl-${t.id}`}
              onPress={() => { setTemplateId(t.id); setA(''); setB(''); }} />
          ))}
        </View>
        {template.fields.map((f) => (
          <Field key={`${template.id}-${f.key}`} label={f.label} placeholder={f.placeholder} maxLength={f.max}
            value={f.key === 'a' ? a : b} onChangeText={f.key === 'a' ? setA : setB}
            error={f.key === 'a' ? errors.a : errors.b} testID={`bet-${f.key}`} />
        ))}
        {statement ? (
          <Card>
            <Text style={s.label}>The bet</Text>
            <Text style={s.statement} testID="statement">{statement}</Text>
          </Card>
        ) : null}
        <View style={s.row}>
          <View style={s.flex}><Field label="Your name" placeholder="Player 1" maxLength={16} value={nameA} onChangeText={setNameA} error={errors.nameA} testID="name-a" /></View>
          <View style={s.flex}><Field label="Your friend" placeholder="Player 2" maxLength={16} value={nameB} onChangeText={setNameB} error={errors.nameB} testID="name-b" /></View>
        </View>
      </Screen>
    );
  }

  if (step === 'belief') {
    return (
      <Screen
        step={2}
        title="How likely is it?"
        lead={statement}
        onBack={() => setStep('bet')}
        footer={<Button label="Next" testID="next" onPress={() => setStep('stake')} />}
      >
        <LikelihoodPicker value={pctA} onChange={setPctA} />
        <Text style={s.small}>Be honest. {B} won't see your number until you've both answered.</Text>
      </Screen>
    );
  }

  if (step === 'stake') {
    return (
      <Screen
        step={3}
        title="What's on the line?"
        onBack={() => setStep('belief')}
        footer={<Button label={`Pass the phone to ${B}`} testID="next" disabled={!stakeReady} onPress={() => { setPctB(50); setSwapped(false); setStep('pass'); }} />}
      >
        <View style={s.chips}>
          {STAKE_PRESETS.map((p) => {
            const id = presetId(p);
            return <Chip key={id} label={p.label} selected={stakeId === id} testID={`stake-${id}`} onPress={() => setStakeId(id)} />;
          })}
          <Chip label="Something else" selected={stakeId === 'custom'} testID="stake-custom" onPress={() => setStakeId('custom')} />
        </View>
        {stakeId === 'custom' ? (
          <Field label="The loser owes…" placeholder="picks the next film" maxLength={40} value={customStake}
            onChangeText={setCustomStake} error={errors.stake} testID="stake-text" />
        ) : null}
        <Text style={s.small}>
          Stakes are IOUs between friends. No money, no dares. With drinks, the loser buys.
        </Text>
      </Screen>
    );
  }

  if (step === 'pass') {
    return (
      <Screen
        title={`Hand the phone to ${B}`}
        lead={`${A} has answered. Their number is hidden.`}
        onBack={() => setStep('stake')}
        footer={<Button label={`I'm ${B}`} testID="next" onPress={() => setStep('friend')} />}
      >
        <View style={s.handoff}><Text style={s.handoffIcon}>{'\u{1F91D}'}</Text></View>
      </Screen>
    );
  }

  if (step === 'friend') {
    return (
      <Screen
        title={`${B}, how likely is it?`}
        lead={statement}
        footer={<Button label="Lock it in" testID="next" onPress={() => setStep('deal')} />}
      >
        <LikelihoodPicker value={pctB} onChange={setPctB} />
        <Text style={s.small}>Your honest guess. You'll both see the fair deal next.</Text>
      </Screen>
    );
  }

  // ----- deal -----
  // By default the person who set up the bet backs YES. "Swap sides" flips that.
  const yes = swapped ? { name: B, pct: pctB } : { name: A, pct: pctA };
  const no = swapped ? { name: A, pct: pctA } : { name: B, pct: pctB };
  const result = splitTheDifference(yes.pct / 100, no.pct / 100);
  const footer = <Button label="New bet" testID="new-bet" onPress={reset} />;

  if (result.kind === 'no-bet') {
    return (
      <Screen title="No bet this way round" footer={footer}>
        <Card>
          <Text style={s.label}>The bet</Text>
          <Text style={s.statement}>{statement}</Text>
        </Card>
        {result.canSwap ? (
          <>
            <Text style={s.body} testID="no-bet">
              {no.name} thinks this is more likely ({no.pct}%) than {yes.name} does ({yes.pct}%), so {no.name} should be the one backing {template.yesLabel}.
            </Text>
            <Button kind="secondary" label="Swap sides" testID="swap" onPress={() => setSwapped(!swapped)} />
          </>
        ) : (
          <Text style={s.body} testID="no-bet">
            You both said {yes.pct}%. You agree, so there's nothing to bet on. Try a different line.
          </Text>
        )}
      </Screen>
    );
  }

  const deal = describeDeal({ q: result.q, yesName: yes.name, noName: no.name, stake: stake! });
  const yesOdds = oddsFor(result.q);
  const noOdds = oddsFor(1 - result.q);
  const exactYes = Math.round(result.q * 1000) / 10;
  const exactNo = Math.round((100 - exactYes) * 10) / 10;

  return (
    <Screen title="The fair deal" footer={footer}>
      <Card>
        <Text style={s.label}>The bet</Text>
        <Text style={s.statement}>{statement}</Text>
        <View style={s.sides}>
          <Text style={s.side}><Text style={{ color: c.yes }}>{template.yesLabel}</Text>  {yes.name}</Text>
          <Text style={s.side}><Text style={{ color: c.no }}>{template.noLabel}</Text>  {no.name}</Text>
        </View>
      </Card>
      <View style={s.dealBox} testID="deal">
        {deal.lines.map((line) => <Text key={line} style={s.dealLine}>{line}</Text>)}
        {deal.notes.map((n) => <Text key={n} style={s.dealNote}>{n}</Text>)}
      </View>

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showMath }} testID="math-toggle"
        onPress={() => setShowMath(!showMath)} style={({ pressed }) => [s.toggle, pressed && { opacity: 0.7 }]}>
        <Text style={s.toggleText}>{showMath ? 'Hide the math' : 'Show the math'}</Text>
      </Pressable>
      {showMath ? (
        <Card testID="math">
          <MathRow label={`${yes.name} said`} value={`${yes.pct}%`} />
          <MathRow label={`${no.name} said`} value={`${no.pct}%`} />
          <MathRow label="Meet in the middle" value={`${exactYes}%`} strong />
          <View style={s.rule} />
          <MathRow label={`${yes.name} on ${template.yesLabel}`} value={`${formatDecimal(yesOdds.decimal)}  (${formatAmerican(yesOdds.american)})`} />
          <MathRow label={`${no.name} on ${template.noLabel}`} value={`${formatDecimal(noOdds.decimal)}  (${formatAmerican(noOdds.american)})`} />
          <Text style={s.mathNote}>Decimal odds, with American odds in brackets.</Text>
          <View style={s.rule} />
          <MathRow label="Exact fair split" value={`${exactYes} : ${exactNo}`} />
          <MathRow label="Shown as" value={`${deal.yesRisk} : ${deal.noRisk}`} />
          {deal.snapped ? (
            <Text style={s.mathNote}>
              This stake can't be split into fractions, so the split is rounded to the nearest simple ratio (1:1, 3:2, 2:1, 3:1, 4:1 or 5:1).
            </Text>
          ) : null}
          <Text style={s.mathNote}>
            Why it's fair: {yes.name} thinks {template.yesLabel} is a {formatPercent(yes.pct / 100)} shot but only pays for {formatPercent(result.q)}; {no.name} gets the same edge on the other side.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

// ----- layout pieces -----

function Screen(props: {
  title: string;
  lead?: string;
  step?: number;
  onBack?: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={s.screen}>
      <ScrollView style={s.flex} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.topRow}>
          {props.onBack ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={props.onBack} testID="back" style={s.back}>
              <Text style={s.backText}>{'‹'} Back</Text>
            </Pressable>
          ) : <View />}
          {props.step ? <Text style={s.stepText}>{props.step} of 3</Text> : null}
        </View>
        <Text accessibilityRole="header" style={s.title} testID="title">{props.title}</Text>
        {props.lead ? <Text style={s.lead}>{props.lead}</Text> : null}
        {props.children}
      </ScrollView>
      {/* The main action always sits at the bottom, under the thumb. */}
      <View style={s.footer}>{props.footer}</View>
    </View>
  );
}

function Card(props: { children: React.ReactNode; testID?: string }) {
  return <View style={s.card} testID={props.testID}>{props.children}</View>;
}

function MathRow(props: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={s.mathRow}>
      <Text style={s.mathLabel}>{props.label}</Text>
      <Text style={[s.mathValue, props.strong && { color: c.accent }]}>{props.value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  content: { padding: 20, gap: 18, paddingBottom: 28 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 32 },
  back: { minHeight: TAP - 12, justifyContent: 'center', paddingRight: 16 },
  backText: { color: c.muted, fontSize: 17 },
  stepText: { color: c.muted, fontSize: 15 },
  title: { color: c.text, fontSize: 32, fontWeight: '800', lineHeight: 38 },
  lead: { color: c.muted, fontSize: 20, lineHeight: 27 },
  body: { color: c.text, fontSize: 18, lineHeight: 26 },
  small: { color: c.muted, fontSize: 15, lineHeight: 21 },
  label: { color: c.muted, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  statement: { color: c.text, fontSize: 21, fontWeight: '700', lineHeight: 28 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  row: { flexDirection: 'row', gap: 12 },
  card: { backgroundColor: c.panel, borderRadius: 18, padding: 18, gap: 8 },
  sides: { marginTop: 6, gap: 4 },
  side: { color: c.text, fontSize: 17, fontWeight: '600' },
  dealBox: { backgroundColor: c.panelHi, borderRadius: 18, padding: 22, gap: 10, borderWidth: 1.5, borderColor: c.accent },
  dealLine: { color: c.text, fontSize: 25, fontWeight: '800', lineHeight: 32 },
  dealNote: { color: c.muted, fontSize: 16, lineHeight: 22 },
  toggle: { minHeight: TAP, justifyContent: 'center', alignItems: 'center' },
  toggleText: { color: c.accent, fontSize: 17, fontWeight: '700' },
  mathRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  mathLabel: { color: c.muted, fontSize: 16, flexShrink: 1 },
  mathValue: { color: c.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  mathNote: { color: c.muted, fontSize: 14, lineHeight: 20 },
  rule: { height: 1, backgroundColor: c.border, marginVertical: 6 },
  handoff: { alignItems: 'center', paddingVertical: 40 },
  handoffIcon: { fontSize: 88 },
  footer: { padding: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.panel, backgroundColor: c.bg },
});
