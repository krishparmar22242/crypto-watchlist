function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function formatPrice(value) {
  if (!isFiniteNumber(value)) {
    return 'N/A';
  }

  const absolute = Math.abs(value);
  let fractionDigits = 2;
  if (absolute < 0.0001) {
    fractionDigits = 8;
  } else if (absolute < 0.01) {
    fractionDigits = 6;
  } else if (absolute < 1) {
    fractionDigits = 4;
  }

  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

export function formatCompact(value) {
  if (!isFiniteNumber(value)) {
    return 'N/A';
  }

  const units = [
    { threshold: 1e12, suffix: 'T' },
    { threshold: 1e9, suffix: 'B' },
    { threshold: 1e6, suffix: 'M' },
    { threshold: 1e3, suffix: 'K' },
  ];
  const unit = units.find(({ threshold }) => Math.abs(value) >= threshold);

  if (!unit) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  const scaled = value / unit.threshold;
  return `${scaled.toFixed(1).replace(/\.0$/, '')}${unit.suffix}`;
}

export function formatPercent(value) {
  if (!isFiniteNumber(value)) {
    return 'N/A';
  }

  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}
