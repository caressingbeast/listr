export default class Utils {

    static pluralize (num, string) {
        if (num === 1) {
            return `${num} ${string}`;
        }

        return `${num} ${string}s`;
    }
}