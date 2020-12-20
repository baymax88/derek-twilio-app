export const DataReducer = (state, action) => {
  switch(action.type) {
    case 'SET_DATA':
      return {
        ...state,
        firstName: action.data.firstName,
        lastName: action.data.lastName,
        email: action.data.email,
        dateTime: action.data.dateTime
      }
    default:
      return state
  }
}