import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import Room from '../components/Room';
import axios from 'axios';
import { AppContext } from '../contexts/AppContext';

const MeetingView = () => {
  const params = useParams();
  const history = useHistory();
  const [roomName, setRoomName] = React.useState(null);
  const [token, setToken] = React.useState(null);
  const { data } = React.useContext(AppContext);

  const handleLogout = React.useCallback(event => {
    setToken(null);
    history.push('/booking');
  }, [history]);

  const handleEndMeeting = React.useCallback(roomSid => {
    handleLogout()
    axios.post('/api/endMeeting', {
      roomSid,
      userEmail: data.email
    }).then(res => {
      if (res.status === 200) {
        console.log(res.data);
      }
    }).catch(err => console.log(err.message))
  }, [data.email])

  React.useEffect(() => {
    if (params) {
      setRoomName(params.roomName);
      setToken(params.token);
    }
  }, [params]);

  let render;
  if (token) {
    render = (
      <Room roomName={roomName} token={token} handleEndMeeting={handleEndMeeting} />
    );
  } else {
    render = (
      <h2>
        Loading...
      </h2>
    );
  }
  return render;
};

export default MeetingView;
