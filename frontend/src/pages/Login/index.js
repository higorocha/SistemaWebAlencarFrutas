//src/pages/login/index.js
import React, { useState, useEffect, useRef } from "react";
import { Form, Input, Button, Typography, Card, Skeleton } from "antd";
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import { showNotification } from "../../config/notificationConfig";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import logo from "../../components/assets/img/logoEstendido.png";
import irrigationImage from "../../assets/img/irrigation.png";
import BackgroundIcons from "./BackgroundIcons";
import "../../styles/antdcustomization.css";

const { Title, Text } = Typography;

const LoginWrapper = styled.div`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: #f5f5f5;
`;

const BackgroundContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Modificado para usar flexbox com justify-content space-between
const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Alterado para distribuir espaço */
  align-items: center;
  padding: 24px;
  position: relative;
  z-index: 1;
  height: 100vh; /* Definido altura para ocupar toda a tela */
`;

// Novo container para o card e formulário
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  width: 100%;
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
`;

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 24px;

  img {
    width: 300px;
    margin-bottom: 20px;
  }
`;

const ImageSection = styled.div`
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  @media (max-width: 768px) {
    display: none;
  }
`;

const OptimizedImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${props => props.$isLoaded ? 1 : 0};
  transition: opacity 0.5s ease-in-out;
  filter: ${props => props.$isLoaded ? 'none' : 'blur(10px)'};
`;

const ImageSkeleton = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

// Modificado para ficar na parte inferior
const FooterContainer = styled.div`
  width: 100%;
  max-width: 400px;
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
`;

// Simplificado
const FooterContent = styled.div`
  background-color: rgba(255, 255, 255, 0.7);
  padding: 12px;
  text-align: center;
  border-radius: 8px;
`;

const FooterText = styled.p`
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  margin-top: 0;
  font-weight: 500;
`;

const VersionText = styled.p`
  font-size: 10px;
  color: #999;
  margin: 0;
  font-weight: 400;
`;

// Componente para carregamento otimizado de imagem
const LazyImage = ({ src, alt, onLoad }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Preload da imagem
    const img = new Image();
    img.onload = () => {
      setIsLoaded(true);
      if (onLoad) onLoad();
    };
    img.onerror = () => {
      setIsError(true);
    };
    img.src = src;
  }, [src, onLoad]);

  if (isError) {
    return (
      <div style={{ 
        width: '100%', 
        height: '100%', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div>🌾</div>
          <div>Sistema de Irrigação</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isLoaded && <ImageSkeleton />}
      <OptimizedImage
        ref={imgRef}
        src={src}
        alt={alt}
        $isLoaded={isLoaded}
        onLoad={() => setIsLoaded(true)}
      />
    </>
  );
};

const Login = () => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Preload de imagens críticas
  useEffect(() => {
    const preloadImages = async () => {
      const imageUrls = [logo, irrigationImage];
      
      try {
        await Promise.all(
          imageUrls.map(url => {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = resolve;
              img.onerror = reject;
              img.src = url;
            });
          })
        );
        setImagesLoaded(true);
      } catch (error) {
        console.warn('Erro ao preload de imagens:', error);
        setImagesLoaded(true); // Continua mesmo com erro
      }
    };

    preloadImages();
  }, []);

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      // Automático: sempre envia 'web' para o sistema web
      await login(values.email, values.password, 'web');
      navigate("/");
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 401) {
          // Credenciais inválidas
          showNotification(
            "error",
            "Erro de Autenticação",
            data.message || "Email ou senha incorretos."
          );
          form.setFields([
            {
              name: "password",
              errors: ["Senha incorreta"],
            },
          ]);
        } else if (status === 400) {
          // Erro de validação
          showNotification(
            "error",
            "Dados Inválidos",
            data.message?.[0] || "Verifique os dados informados."
          );
        } else if (status === 500) {
          // Erro interno do servidor
          showNotification(
            "error",
            "Erro no Servidor",
            data.message || "Erro interno do servidor."
          );
        }
      } else {
        // Falha de conexão ou outro erro
        showNotification(
          "error",
          "Erro de Conexão",
          "Não foi possível conectar ao servidor. Verifique sua conexão."
        );
      }
      form.scrollToField("password");
    } finally {
      setIsLoading(false);
    }
  };

  // Mostra skeleton enquanto carrega
  if (!imagesLoaded) {
    return (
      <LoginWrapper>
        <BackgroundContainer>
          <BackgroundIcons />
        </BackgroundContainer>
        <ContentGrid>
          <FormSection>
            <FormContainer>
              <Skeleton active paragraph={{ rows: 8 }} />
            </FormContainer>
          </FormSection>
          <ImageSection>
            <ImageSkeleton />
          </ImageSection>
        </ContentGrid>
      </LoginWrapper>
    );
  }

  return (
    <LoginWrapper>
      <BackgroundContainer>
        <BackgroundIcons />
      </BackgroundContainer>

      <ContentGrid>
        <FormSection>
          {/* Container para o formulário */}
          <FormContainer>
            <StyledCard>
              <LogoContainer>
                <img src={logo} alt="AlencarFrutas" />
                <Title level={4}>Bem-vindo ao AlencarFrutas</Title>
              </LogoContainer>
              <Form
                form={form}
                name="login"
                className="login-form"
                onFinish={handleSubmit}
                layout="vertical"
                requiredMark={false}
              >
                <Form.Item
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Por favor, insira seu email",
                    },
                    { type: "email", message: "Email inválido" },
                  ]}
                >
                  <Input
                    prefix={
                      <UserOutlined
                        style={{ color: "rgba(0,0,0,.45)", fontSize: "16px" }}
                      />
                    }
                    placeholder="Email"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: "Por favor, insira sua senha",
                    },
                  ]}
                >
                  <Input.Password
                    prefix={
                      <LockOutlined
                        style={{ color: "rgba(0,0,0,.45)", fontSize: "16px" }}
                      />
                    }
                    placeholder="Senha"
                    size="large"
                    iconRender={(visible) =>
                      visible ? (
                        <EyeTwoTone style={{ fontSize: "16px" }} />
                      ) : (
                        <EyeInvisibleOutlined style={{ fontSize: "16px" }} />
                      )
                    }
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={isLoading}
                  >
                    Entrar
                  </Button>
                </Form.Item>
              </Form>
            </StyledCard>
          </FormContainer>
          
          {/* Rodapé simplificado */}
          <FooterContainer>
            <FooterContent>
              <FooterText>Sistemas de Informações - AlencarFrutas</FooterText>
              <VersionText>Versão 1.0.0</VersionText>
            </FooterContent>
          </FooterContainer>
        </FormSection>

        <ImageSection>
          <LazyImage src={irrigationImage} alt="Irrigação" />
        </ImageSection>
      </ContentGrid>
    </LoginWrapper>
  );
};

export default Login;