import Immutable from 'immutable';

export default (state = Immutable.Map(), action) => {
    switch (action.type) {

        case 'SET_USER': {
            return Immutable.Map(action.user);
        }

        default:
            return state;
    }
};