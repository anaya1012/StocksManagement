import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { Form, Input, Button } from 'antd';

const Login = () => {   
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate(); // Initialize useNavigate

    const handleUsernameChange = e => {
        setUsername(e.target.value);
    };

    const handlePasswordChange = e => {
        setPassword(e.target.value);
    };

    const onFinishFailed = errorInfo => {
        console.log('Failed:', errorInfo);
    };

    const onFinish = async () => {
        var formData = {
            username: username,
            password: password
        };
        console.log(formData)
        try {
            const response = await fetch('http://localhost:5000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            console.log(data);
            if (data.token) {
                sessionStorage.setItem('token', data.token);
                console.log('Token stored in session storage.');
                navigate('/dashboard'); // Redirect to dashboard route using navigate
            } else {
                alert('Invalid username or password.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Login failed. Please try again.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-box">
                <div className="illustration-wrapper">
                    <img src="https://media.licdn.com/dms/image/D5612AQGwzlrwh14Q4A/article-cover_image-shrink_720_1280/0/1675352980476?e=1718236800&v=beta&t=k-8GUmOGOR9p9sHEYBPu6EcFwRgWUk-L2g3GJMmSUPc" alt="Login" />
                </div>
                <Form
                    name="login-form"
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    onFinishFailed={onFinishFailed}
                >
                    <p className="form-title">Welcome to Stock Trading System</p>
                    <p>Login to the Dashboard</p>
                    <Form.Item
                        className="username-input"
                        name="username"
                        rules={[{ required: true, message: 'Please input your username!' }]}
                    >
                        <Input
                            placeholder="Username"
                            onChange={handleUsernameChange}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                        style={{ marginTop: '60px' }}
                    >
                        <Input.Password
                            placeholder="Password"
                            onChange={handlePasswordChange}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="login-form-button">
                            LOGIN
                        </Button>
                    </Form.Item>
                    
                    <Button type="button" class= "btn btn-link" onClick={() => navigate('/register')}>
                        Dont have an account ? Sign Up
                    </Button>
                   
                </Form>
            </div>
        </div>
    );
};

export default Login;
