import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { Form, Input, Button } from 'antd';

const Login = () => {   
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState(''); // Add email state
    const navigate = useNavigate(); // Initialize useNavigate

    const handleUsernameChange = e => {
        setUsername(e.target.value);
    };

    const handlePasswordChange = e => {
        setPassword(e.target.value);
    };

    const handleEmailChange = e => {
        setEmail(e.target.value);
    };

    const onFinishFailed = errorInfo => {
        console.log('Failed:', errorInfo);
    };

    const onFinish = async () => {
        var formData = {
            username: username,
            password: password,
            email: email // Add email to formData
        };
        console.log(formData)
        try {
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                alert('User registered successfully');
                navigate('/login'); // Redirect to login page after successful registration
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to register user. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Registration failed. Please try again.');
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
                    <br></br>
                    <p><h3>Create your account</h3></p>
                    <Form.Item
                        className="username-input"
                        name="username"
                        rules={[{ required: true, message: 'Please input your username!' }]}
                    >
                        <Input
                            placeholder="Enter Username"
                            onChange={handleUsernameChange}
                        />
                    </Form.Item>

                    <Form.Item
                        name="email" // Add email field
                        rules={[{ required: true, message: 'Please input your email!' }]}
                        style={{ marginTop: '20px' }}
                    >
                        <Input
                            placeholder="Enter Email"
                            onChange={handleEmailChange}
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                        style={{ marginTop: '20px' }}
                    >
                        <Input.Password
                            placeholder="Enter Password"
                            onChange={handlePasswordChange}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="login-form-button">
                            REGISTER
                        </Button>
                    </Form.Item>
                    
                </Form>
            </div>
        </div>
    );
};

export default Login;
