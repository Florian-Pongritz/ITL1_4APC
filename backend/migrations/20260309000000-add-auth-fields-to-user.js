'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'password', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('Users', 'name', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('Users', 'phone', {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn('Users', 'type', {
      type: Sequelize.STRING
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'password');
    await queryInterface.removeColumn('Users', 'name');
    await queryInterface.removeColumn('Users', 'phone');
    await queryInterface.removeColumn('Users', 'type');
  }
};
