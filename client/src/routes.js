import React from 'react';
import {
  Switch,
  Redirect,
  Route
} from 'react-router-dom';

import BookingView from './views/BookingView';
import MeetingView from './views/MeetingView';

export const renderRoutes = (routes = []) => (
  <Switch>
    {routes.map((route, i) => {
      const Component = route.component;

      return (
        <Route
          key={i}
          path={route.path}
          exact={route.exact}
          render={(props) => (
            <>
              {route.routes
              ? renderRoutes(route.routes)
              : <Component {...props} />}
            </>
          )}
        />
      );
    })}
  </Switch>
);

const routes = [
  {
    exact: true,
    path: '/booking',
    component: () => <BookingView />
  },
  {
    exact: true,
    path: '/meeting/:roomName/:token',
    component: () => <MeetingView />
  },
  {
    path: '*',
    routes: [
      {
        exact: true,
        path: '/',
        component: () => <Redirect to="/booking" />
      },
      {
        component: () => <Redirect to="/booking" />
      }
    ]
  }
];

export default routes;
