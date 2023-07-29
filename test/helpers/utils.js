export function getEmitCalls(emit, pattern) {
  const calls = [];

  for (let i = 0; i < emit.callCount; i++) {
    const call = emit.getCall(i);

    if (pattern instanceof RegExp && call.args[0].match(pattern)) {
      calls.push(call);
    }
    else if (call.args[0] === pattern) {
      calls.push(call);
    }
  }

  return calls;
}
