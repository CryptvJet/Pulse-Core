const pulseLength = 3;
const collapseThreshold = 50;

function accumulateEnergy(complexities, durations) {
    let energy = 0;
    let collapse = false;
    for (let i = 0; i < complexities.length; i++) {
        const complexity = complexities[i];
        const dur = durations[i];
        energy += complexity * (dur / 16);
        if (i + 1 >= pulseLength && energy >= collapseThreshold) {
            collapse = true;
            break;
        }
    }
    return collapse;
}

test('collapse waits until pulse length reached', () => {
    const complexities = [40,40,40];
    const durations = [16,16,16];
    expect(accumulateEnergy(complexities, durations)).toBe(true);
});

test('collapse does not trigger without enough energy', () => {
    const complexities = [5,5,5,5];
    const durations = [16,16,16,16];
    expect(accumulateEnergy(complexities, durations)).toBe(false);
});
