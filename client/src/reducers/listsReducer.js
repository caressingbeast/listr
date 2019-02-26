export default (state = {}, action) => {
    switch (action.type) {

        case 'SET_LISTS': {
            return action.payload;
        }

        default:
            return state;
    }
};