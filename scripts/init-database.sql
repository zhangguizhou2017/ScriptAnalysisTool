-- 剧本解析工具数据库初始化脚本
-- 确保与TodoList项目使用不同的数据库

-- 创建独立的数据库
CREATE DATABASE IF NOT EXISTS scriptanalysisdb 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE scriptanalysisdb;

-- 项目表将由应用自动创建
-- script_projects, tag_types, script_data

-- 显示创建的数据库
SHOW DATABASES LIKE '%app%';