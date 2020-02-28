/**
 * Compose function to combine Higher-Order Components (HOCs)
 * Replacement for recompose's compose (deprecated package)
 */
export const compose = (...funcs: Function[]) => {
    if (funcs.length === 0) {
        return (arg: any) => arg;
    }
    if (funcs.length === 1) {
        return funcs[0];
    }
    return funcs.reduce((a, b) => (...args: any[]) => a(b(...args)));
};

export default compose;
