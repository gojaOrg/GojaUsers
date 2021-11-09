const mongoose = require('mongoose');
const dbHandler = require('./db-handler');

const userModel = require('../models/user');
const userData = {
    profileAudio: "audioURL",
    userName: 'testersson',
    email: 'test@test.se',
};

/**
 * Connect to a new in-memory database before running any tests.
 */
 beforeAll(async () => await dbHandler.connect());

 /**
  * Clear all test data after every test.
  */
  afterEach(async () => await dbHandler.clearDatabase());

  /**
  * Remove and close the db and server.
  */

 afterAll(async () => await dbHandler.closeDatabase());

/**
 * User test suite.
 */
 describe('User Model Test ', () => {

    it('create & save user successfully', async () => {

      const savedUser = await userModel.create(userData);
      expect(savedUser._id).toBeDefined();
      expect(savedUser.profileAudio).toBe(userData.profileAudio);
      expect(savedUser.userName).toBe(userData.userName);
      expect(savedUser.email).toBe(userData.email);
    });

    it('delete user successfully', async () => {

      const savedUser = await userModel.create(userData);
      expect(savedUser._id).toBeDefined();
      var res = await userModel.exists({_id: savedUser._id});
      expect(res).toBeTruthy();

      await userModel.deleteOne({_id: savedUser._id});
      res = await userModel.exists({_id: savedUser._id});
      expect(res).toBeFalsy();

    });

    it('insert user successfully, but the field does not defined in schema should be undefined', async () => {
      const userWithInvalidField = new userModel({ profileAudio: 'udioURL', userName: 'test', email: 'testsson', nickname: 'Handsome tester' });
      const savedUserWithInvalidField = await userWithInvalidField.save();
      expect(savedUserWithInvalidField._id).toBeDefined();
      expect(savedUserWithInvalidField.nickkname).toBeUndefined();
    });

    it('create user without required field should failed', async () => {
      const userWithoutRequiredField = new userModel({ userName: 'test' });
      let err;
      try {
          const savedUserWithoutRequiredField = await userWithoutRequiredField.save();
          error = savedUserWithoutRequiredField;
      } catch (error) {
          err = error
      }
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError)
      expect(err.errors.email).toBeDefined();
    });
});