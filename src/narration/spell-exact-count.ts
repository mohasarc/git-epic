const unitsAndTeens = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export function spellExactCount(count: number): string {
  if (!Number.isInteger(count) || count < 1 || count > 99999) {
    throw new RangeError(`count must be an integer in 1..99999, got: ${count}`);
  }
  const thousandsPart = Math.floor(count / 1000);
  const belowThousand = count % 1000;
  if (thousandsPart === 0) return spellBelowThousand(belowThousand);
  const head = `${spellBelowHundred(thousandsPart)} thousand`;
  if (belowThousand === 0) return head;
  if (belowThousand < 100) return `${head} and ${spellBelowHundred(belowThousand)}`;
  return `${head} ${spellBelowThousand(belowThousand)}`;
}

function spellBelowThousand(value: number): string {
  const hundredsPart = Math.floor(value / 100);
  const belowHundred = value % 100;
  if (hundredsPart === 0) return spellBelowHundred(belowHundred);
  const head = `${unitsAndTeens[hundredsPart]} hundred`;
  if (belowHundred === 0) return head;
  return `${head} and ${spellBelowHundred(belowHundred)}`;
}

function spellBelowHundred(value: number): string {
  if (value < 20) return unitsAndTeens[value];
  const ten = tens[Math.floor(value / 10)];
  const unit = value % 10;
  return unit === 0 ? ten : `${ten}-${unitsAndTeens[unit]}`;
}
