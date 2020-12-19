import React, { useState, useEffect, useCallback } from 'react';
import Video from 'twilio-video';
import Participant from './Participant';
import {
  PhoneOff,
  Mic,
  MicOff
} from 'react-feather';

const Room = ({ roomName, token, handleEndMeeting }) => {
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isAudioMute, setIsAudioMute] = useState(false);

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

  const renderRemoteParticipant = useCallback(() => {
    return (
      <div className="remote-participants">
        {participants.length !== 0 &&
          <Participant key={participants[0].sid} participant={participants[0]} />
        }
      </div>
    )
  }, [participants]);

  const audioMute = useCallback(() => {
    if (room) {
      if (isAudioMute) {
        room.localParticipant.audioTracks.forEach(function(trackId, track) {
          track.disable();
        });
      } else {
        room.localParticipant.audioTracks.forEach(function(trackId, track) {
          track.enable();
        });
      }
    }
  }, [room, isAudioMute]);

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
        {renderRemoteParticipant()}
        <div className="button-box">
          <button className="phone-off" onClick={() => handleEndMeeting(room.sid)}>
            <PhoneOff />
          </button>
          <button className="audio" onClick={audioMute}>
            {isAudioMute ? <MicOff /> : <Mic />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Room;