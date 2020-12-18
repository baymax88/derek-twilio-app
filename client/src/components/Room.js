import React, { useState, useEffect } from 'react';
import Video from 'twilio-video';
import Participant from './Participant';
import {
  PhoneOff,
  Mic,
  MicOff
} from 'react-feather';

const Room = ({ roomName, token, handleLogout }) => {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [audioMute, setAudioMute] = useState(false);

  useEffect(() => {
    const participantConnected = participant => {
      setParticipants(prevParticipants => [...prevParticipants, participant]);
    };

    const participantDisconnected = participant => {
      setParticipants(prevParticipants =>
        prevParticipants.filter(p => p !== participant)
      );
    };

    Video.connect(token, {
      name: roomName
    }).then(room => {
      setRoom(room);
      room.on('participantConnected', participantConnected);
      room.on('participantDisconnected', participantDisconnected);
      room.participants.forEach(participantConnected);
    });

    return () => {
      setRoom(currentRoom => {
        if (currentRoom && currentRoom.localParticipant.state === 'connected') {
          currentRoom.localParticipant.tracks.forEach(function(trackPublication) {
            trackPublication.track.stop();
          });
          currentRoom.disconnect();
          return null;
        } else {
          return currentRoom;
        }
      });
    };
  }, [roomName, token]);

  const renderRemoteParticipant = audioMute => {
    return (
      <div className="remote-participants">
        {
          participants.map(participant => (
            <Participant key={participant.sid} participant={participant} audioMute={audioMute} />
          ))
        }
      </div>
    )
  }

  return (
    <div className="room">
      <h2>Room: {roomName}</h2>
      <div className="layout">
        {/* <div className="local-participant">
          {room ? (
            <Participant
              key={room.localParticipant.sid}
              participant={room.localParticipant}
            />
          ) : (
            ''
          )}
        </div> */}
        {renderRemoteParticipant}
        <div className="button-box">
          <button className="phone-off" onClick={handleLogout}>
            <PhoneOff />
          </button>
          <button className="audio" onClick={() => setAudioMute(!audioMute)}>
            {audioMute ? <MicOff /> : <Mic />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;