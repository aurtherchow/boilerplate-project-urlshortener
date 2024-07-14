db.createUser({
    user: 'admin',
    pwd: 'secret',
    roles: [
      {
        role: 'root',
        db: 'admin'
      }
    ]
  });
  
  db = db.getSiblingDB('urldatabase');
  db.createUser({
    user: 'url',
    pwd: 'Url12345',
    roles: [
      {
        role: 'readWrite',
        db: 'urldatabase'
      }
    ]
  });
  
  db.createCollection('urlcollection');
  