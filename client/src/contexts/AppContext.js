import React, { createContext, useReducer, useEffect } from 'react'
import { DataReducer } from '../reducers/DataReducer';

export const AppContext = createContext()

const AppContextProvider = (props) => {
  const [data, dispatch] = useReducer(DataReducer, {
    firstName: '',
    lastName: '',
    email: '',
    dateTime: new Date().toISOString().substring(0, 19)
  }, () => {
    const localData = localStorage.getItem('data')
    return localData ? JSON.parse(localData) : []
  })

  useEffect(() => {
    localStorage.setItem('data', JSON.stringify(data))
  }, [data])

  const setData = (data) => {
    dispatch({
      type: 'SET_DATA',
      data
    })
  }

  return (
    <AppContext.Provider value={{data, setData}}>
      {props.children}
    </AppContext.Provider>
  )
}

export default AppContextProvider