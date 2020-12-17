import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import Room from '../components/Room';

const MeetingView = () => {
  const params = useParams();
  const history = useHistory();
  const [roomName, setRoomName] = React.useState(null);
  const [token, setToken] = React.useState(null);

  const handleLogout = React.useCallback(event => {
    setToken(null);
    history.push('/booking');
  }, [history]);

  React.useEffect(() => {
    if (params) {
      setRoomName(params.roomName);
      setToken(params.token);
    }
  }, [params]);

  let render;
  if (token) {
    render = (
      <Room roomName={roomName} token={token} handleLogout={handleLogout} />
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
