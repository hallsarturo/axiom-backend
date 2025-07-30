export async function up(queryInterface) {
    await queryInterface.removeColumn('philarchive_categories', 'path');
    await queryInterface.removeColumn('philarchive_categories', 'href');
}

export async function down(queryInterface, DataTypes) {
    await queryInterface.addColumn('philarchive_categories', 'path', {
        type: DataTypes.STRING(255),
        allowNull: true,
    });
    await queryInterface.addColumn('philarchive_categories', 'href', {
        type: DataTypes.STRING(255),
        allowNull: true,
    });
}