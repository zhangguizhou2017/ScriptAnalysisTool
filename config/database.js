const mysql = require('mysql2/promise');

const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'todoapp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(config);

async function initDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password
        });
        
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.database}`);
        console.log('✅ 数据库创建成功');
        
        await connection.end();
        
        const dbConnection = await pool.getConnection();
        
        const createScriptProjectsTable = `
            CREATE TABLE IF NOT EXISTS script_projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        
        const createTagTypesTable = `
            CREATE TABLE IF NOT EXISTS tag_types (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        
        const createScriptDataTable = `
            CREATE TABLE IF NOT EXISTS script_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                tag_type_id INT NOT NULL,
                content TEXT NOT NULL,
                summary TEXT,
                metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES script_projects(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_type_id) REFERENCES tag_types(id) ON DELETE CASCADE
            )
        `;
        
        await dbConnection.execute(createScriptProjectsTable);
        await dbConnection.execute(createTagTypesTable);
        await dbConnection.execute(createScriptDataTable);
        
        const insertDefaultTagTypes = `
            INSERT IGNORE INTO tag_types (name, description) VALUES 
            ('人物', '剧本中的角色和人物'),
            ('场景', '剧本中的场景和地点'),
            ('道具', '剧本中的道具和物品'),
            ('情节', '剧本中的重要情节点'),
            ('对话', '剧本中的重要对话片段'),
            ('动作', '剧本中的动作描述')
        `;
        
        await dbConnection.execute(insertDefaultTagTypes);
        console.log('✅ 剧本解析数据表创建成功');
        
        dbConnection.release();
        
    } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message);
        throw error;
    }
}

initDatabase();

module.exports = pool;