import React from 'react';
import axios from 'axios';
import BookingForm from '../components/BookingForm';
import { AppContext } from '../contexts/AppContext';

const BookingView = () => {
  const [prospectData, setProspectData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    dateTime: new Date().toISOString().substring(0, 19)
  });
  const [booked, setBooked] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const { setData } = React.useContext(AppContext);

  const handleProspectData = React.useCallback(
    event => {
      setProspectData({
        ...prospectData,
        [event.target.name]: event.target.value
      });
    },
    [prospectData]
  );

  const handleSubmit = React.useCallback(
    async event => {
      setData(prospectData)
      setLoading(true)
      event.preventDefault();
      axios.post(`/api/setMeeting`, prospectData).then(res => {
        if (res.status === 200) {
          setBooked(true);
          setLoading(false);
        }
        console.log(res.data);
      }).catch(err => {
        setLoading(false);
        console.log(err.message);
      });
    },
    [prospectData]
  );

  let render;

  if (loading) {
    render = (
      <h2>
        Loading...
      </h2>
    )
  } else if (booked) {
    render = (
      <h2>
        Meeting is booked, please check your email for confirmation.
      </h2>
    );
  } else {
    render = (
      <BookingForm
        prospectData={prospectData}
        handleProspectData={handleProspectData}
        handleSubmit={handleSubmit}
      />
    );
  }
  return render;
};

export default BookingView;