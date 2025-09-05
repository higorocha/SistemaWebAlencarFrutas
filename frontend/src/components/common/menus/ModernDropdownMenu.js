import React from 'react';
import { Typography } from 'antd';
import PropTypes from 'prop-types';
import './ModernDropdownMenu.css';

const { Text } = Typography;

/**
 * Componente de menu dropdown moderno e reutilizável
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Object} props.record - O registro/item ao qual o menu se refere
 * @param {string} props.title - Título a ser exibido no cabeçalho do menu (opcional)
 * @param {Array} props.items - Array de itens do menu
 * @param {Array} props.categories - Array de categorias para organizar os itens
 * @returns {JSX.Element} Menu moderno
 */
const ModernDropdownMenu = ({ record, title, items, categories = [] }) => {
  // Organizar itens por categoria
  const renderItems = () => {
    // Se não houver categorias, renderizar todos os itens em sequência
    if (categories.length === 0) {
      return items.map((item, index) => renderMenuItem(item, index));
    }

    // Caso contrário, renderizar itens agrupados por categoria
    return categories.map((category, catIndex) => (
      <React.Fragment key={`cat-${catIndex}`}>
        <div className="menu-category">{category.title}</div>
        {items
          .filter(item => item.category === category.key)
          .map((item, itemIndex) => renderMenuItem(item, itemIndex))}
      </React.Fragment>
    ));
  };

  // Renderizar um item de menu individual
  const renderMenuItem = (item, index) => (
    <div
      key={`item-${index}`}
      className={`menu-item ${item.disabled ? 'menu-item-disabled' : 'menu-item-hover'}`}
      onClick={() => !item.disabled && item.onClick && item.onClick(record)}
    >
      {item.icon && (
        <span className="menu-icon" style={{ color: item.disabled ? '#d9d9d9' : (item.iconColor || '#1890ff') }}>
          {item.icon}
        </span>
      )}
      <span>
        <div className={item.disabled ? 'text-disabled' : ''}>{item.label}</div>
        {item.description && (
          <div className={`menu-item-description ${item.disabled ? 'text-disabled' : ''}`}>{item.description}</div>
        )}
      </span>
    </div>
  );

  return (
    <div className="modern-menu">
      {/* Cabeçalho do Menu */}
      {title && (
        <div className="menu-header">
          <Text strong>{title}</Text>
        </div>
      )}

      {/* Itens do Menu */}
      {renderItems()}
    </div>
  );
};

ModernDropdownMenu.propTypes = {
  record: PropTypes.object.isRequired,
  title: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      iconColor: PropTypes.string,
      description: PropTypes.string,
      onClick: PropTypes.func,
      category: PropTypes.string,
      disabled: PropTypes.bool
    })
  ).isRequired,
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    })
  )
};

export default ModernDropdownMenu; 