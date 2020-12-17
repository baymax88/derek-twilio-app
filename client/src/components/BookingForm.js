import React from 'react';

const BookingForm = ({
  prospectData,
  handleProspectData = () => {},
  handleSubmit = () => {}
}) => {
  return (
    <form onSubmit={handleSubmit}>
      <h2>Please fill out the form below to schedule a call</h2>
      <div>
        <input
          type="text"
          name="firstName"
          value={prospectData.firstName}
          placeholder="First Name"
          onChange={handleProspectData}
          required
        />
      </div>
      <div>
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          value={prospectData.lastName}
          onChange={handleProspectData}
          required
        />
      </div>

      <div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={prospectData.email}
          onChange={handleProspectData}
          required
        />
      </div>

      <div>
        <input
          type="dateTime-local"
          name="dateTime"
          placeholder="Meeting Time"
          value={prospectData.dateTime}
          onChange={handleProspectData}
          required
        />
      </div>

      <button type="submit">Submit</button>
    </form>
  );
};

export default BookingForm;
