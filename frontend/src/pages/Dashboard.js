import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Statistic } from "antd";
import { DashboardOutlined, UserOutlined, SettingOutlined } from "@ant-design/icons";
import { styled } from "styled-components";
import axiosInstance from "../api/axiosConfig";
import { useTheme } from '@mui/material/styles';

const { Title } = Typography;

const CardStyled = styled(Card)`
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.05);
  height: 100%;
  transition: transform 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConfigs: 0,
    systemStatus: 'online'
  });
  const theme = useTheme();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Simular dados do dashboard - será conectado ao backend depois
        setStats({
          totalUsers: 0,
          totalConfigs: 0,
          systemStatus: 'online'
        });
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div className="spinner">Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <DashboardOutlined /> Dashboard
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <CardStyled>
            <Statistic
              title="Usuários"
              value={stats.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: theme.palette.data.positive }}
            />
          </CardStyled>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <CardStyled>
            <Statistic
              title="Configurações"
              value={stats.totalConfigs}
              prefix={<SettingOutlined />}
              valueStyle={{ color: theme.palette.data.neutral }}
            />
          </CardStyled>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <CardStyled>
            <Statistic
              title="Status do Sistema"
              value={stats.systemStatus}
              valueStyle={{ 
                color: stats.systemStatus === 'online' ? theme.palette.data.positive : theme.palette.data.negative
              }}
            />
          </CardStyled>
        </Col>
      </Row>

      <Row style={{ marginTop: '24px' }}>
        <Col span={24}>
          <CardStyled>
            <Title level={4}>Bem-vindo ao Sistema</Title>
            <p>
              Este é o dashboard base do sistema. Aqui você poderá adicionar 
              os módulos e funcionalidades específicas do seu projeto.
            </p>
          </CardStyled>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
