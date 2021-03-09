CREATE DATABASE alkemy_challenge_db;

USE alkemy_challenge_db;

CREATE TABLE users(
    id INT(11) NOT NULL AUTO_INCREMENT,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(60) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    balance INT(11) NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE transactions(
    id INT(11) NOT NULL AUTO_INCREMENT,
    amount INT(11) NOT NULL,
    type VARCHAR(10) NOT NULL,
    category VARCHAR(50) NOT NULL,
    user_id INT(11) NOT NULL,
    date DATE NOT NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    PRIMARY KEY(id)
);
