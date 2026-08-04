// Powers the "隨機練習" (Random Practice) sidebar mode: draws one quote at a
// time, weighted so quotes further along in the write-a-scenario /
// write-a-practice workflow come up less often.
//
// Quotes are bucketed into three tiers:
//   0 — no scenarios yet (least practiced, drawn most often)
//   1 — has scenario(s) but no practice written under any of them
//   2 — has at least one practice already (most practiced, drawn least often)
//
// Tier weights follow a geometric progression (each tier half as likely as
// the one before it: TIER_RATIO ** tier), normalized across whichever tiers
// currently have quotes in them.
const TIER_RATIO = 0.5;

function quoteTier(quote) {
  if (quote.scenarios.length === 0) return 0;
  const hasPractice = quote.scenarios.some((sc) => sc.practices.length > 0);
  return hasPractice ? 2 : 1;
}

// Picks one quote at random, excluding `excludeId` (e.g. the card currently
// shown) so pressing "下一張" doesn't just redraw the same card — unless
// that's the only quote left, in which case it's drawn again anyway.
// Returns null if there are no quotes to practice with.
export function drawRandomPracticeQuote(db, excludeId) {
  const all = db.quotes.filter((q) => !q.deletedAt);
  if (all.length === 0) return null;

  const pool = all.length > 1 ? all.filter((q) => q.id !== excludeId) : all;

  const tiers = [[], [], []];
  pool.forEach((q) => tiers[quoteTier(q)].push(q));

  const availableTiers = tiers
    .map((list, tier) => ({ list, weight: TIER_RATIO ** tier }))
    .filter((t) => t.list.length > 0);

  const totalWeight = availableTiers.reduce((sum, t) => sum + t.weight, 0);
  let r = Math.random() * totalWeight;
  let chosenList = availableTiers[availableTiers.length - 1].list;
  for (const t of availableTiers) {
    if (r < t.weight) {
      chosenList = t.list;
      break;
    }
    r -= t.weight;
  }

  return chosenList[Math.floor(Math.random() * chosenList.length)];
}

// Writing-practice prompts shown by the lightbulb button on the edit-card
// view — each click swaps in a different random suggestion for how to
// practice with the current quote.
const PRACTICE_PROMPTS = {
  zh: [
    '請使用一樣的修辭造句',
    '拿這句話的動詞造一個句子',
    '拿這句話的形容詞造一個句子',
    '拿這句話的名詞造一個句子',
    '用同樣的句型結構，替換不同的主題造句',
    '模仿這句話的句型結構',
    '保留句子開頭的句型，換句尾造出不同意思的句子',
    '換成你自己的生活經驗，寫一句意思相近的話',
    '把這句話的場景換成另一個地方，重新造句',
    '用相反的心情或語氣，改寫這句話',
    '把這句話的主角換成動物或物品，重新造句',
    '想像換一個人（不同身分、年齡、立場）來說這句話，會怎麼說',
    '把這句話的時間點改變（過去／現在／未來），重新造句',
    '用這句話的主題，但換一個季節或時間點來寫',
    '把這句話變成一個問句，再自己回答',
    '用這句話的情緒，套進不同的事件裡造句',
    '想一個和這句話相反的情境，寫一句對比的句子',
    '用這句話傳達的道理或訊息，舉一個例子來說明',
    '把這句話換個場合或對象說出來，看看意思會不會改變',
    '用一句話說出這句話帶給你的感覺或聯想',
  ],
  en: [
    'Write a new sentence using the same rhetorical device',
    'Take the verb from this sentence and write a new sentence with it',
    'Take the adjective from this sentence and write a new sentence with it',
    'Take the noun from this sentence and write a new sentence with it',
    'Keep the same sentence structure, but write about a different subject',
    'Imitate the sentence structure of this quote',
    'Keep the opening of the sentence, but change the ending to mean something different',
    'Rewrite it using an experience from your own life that feels similar',
    'Move the scene to a different place and rewrite the sentence',
    'Rewrite it with the opposite mood or tone',
    'Replace the subject with an animal or an object and rewrite the sentence',
    'Imagine a different person (different identity, age, or stance) saying this — how would they say it',
    'Change the time frame (past, present, or future) and rewrite the sentence',
    'Keep the theme, but write about a different season or time of day',
    'Turn this sentence into a question, then answer it yourself',
    'Take the emotion in this sentence and apply it to a different event',
    'Think of a situation opposite to this one and write a contrasting sentence',
    'Give an example that illustrates the lesson or message of this sentence',
    'Say this sentence in a different setting or to a different audience, and see if the meaning changes',
    'Describe in one sentence the feeling or association this quote gives you',
  ],
};

// Picks one prompt at random, excluding `exclude` (the one currently shown)
// so repeated clicks always surface a different suggestion — unless it's
// the only prompt left, in which case it's drawn again anyway.
export function drawRandomPracticePrompt(exclude, language = 'zh') {
  const prompts = PRACTICE_PROMPTS[language] ?? PRACTICE_PROMPTS.zh;
  const pool = prompts.length > 1 ? prompts.filter((p) => p !== exclude) : prompts;
  return pool[Math.floor(Math.random() * pool.length)];
}
