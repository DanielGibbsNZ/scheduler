Opps
----

- Email is on ScheduledUser. Opps. Should be on person, then scheduled user references person to check it, otherwise we can't have people with email addresses who can't login (possible for initial setup)


- We model user/person on the server, but don't do this on the client.
  So we don't yet have a sensible place to put the login info returned by the server.


- Two logins. One account, then the google stuff. We prob need to begin storing the google tokens as part of the user profile so they can be used by he UI. The UI would need to then persist these on the server.
  - Have token on server for the user. Done.
  - Allow a client to auth to google. I think that auth can be restored automatically (via GAPI).
  - Snapshots and such could be taken by the client, processed, and stored on the server so the client doesn't ALWAYS have to process them

- Get the tests going. They don't run. Karma complains about a lack of a constructor. Gee this JS/transpiling is pretty .... "Crap-O"