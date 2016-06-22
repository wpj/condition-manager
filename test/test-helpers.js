export function makeSideEffectFunc() {
  let c = 0;
  const counter = () => c;
  const func = (val) => {
    c++;
    return val;
  }

  return { counter, func }
}
