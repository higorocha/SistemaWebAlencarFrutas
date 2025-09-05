/**
 * // src/utils/functionsUtils.js
/**
 /**
 * Navega para o próximo campo editável e seleciona o conteúdo ao pressionar Enter.
 * 
 * @param {Object} record - O registro atual da tabela.
 * @param {Object} form - O formulário Ant Design.
 * @param {Function} onSave - A função para salvar o registro atual.
 */
 export const handleEnterPress = (record) => {
  // Encontra todos os inputs editáveis da tabela
  const editableInputs = Array.from(
    document.querySelectorAll('.ant-table-row .ant-input-number-input')
  );

  // Encontra o input atual
  const currentInput = document.querySelector(
    `input[id$="leitura_${record.id}"]`
  );

  if (currentInput) {
    const currentIndex = editableInputs.findIndex(
      input => input === currentInput
    );

    // Se encontrou o índice atual e existe um próximo input
    if (currentIndex > -1 && currentIndex < editableInputs.length - 1) {
      const nextInput = editableInputs[currentIndex + 1];

      // Agenda a focagem e seleção para o próximo tick do event loop
      setTimeout(() => {
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
          
          // Garante que o input está visível na viewport
          nextInput.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          });
        }
      }, 100);
    }
  }
};

// Nova função para lidar com Tab
export const handleTabPress = (record, editingKeys, edit) => {
  if (!record || !editingKeys || !edit) return; // validação básica

  const currentIndex = record.faturas.findIndex(f => f.id === record.id);
  if (currentIndex < record.faturas.length - 1) {
    const nextFaturaId = record.faturas[currentIndex + 1].id;
    
    if (editingKeys.has(nextFaturaId)) {
      const nextInput = document.querySelector(`input[id='leitura_${nextFaturaId}']`);
      if (nextInput) nextInput.focus();
    } else {
      edit(record.faturas[currentIndex + 1]);
      setTimeout(() => {
        const nextInput = document.querySelector(`input[id='leitura_${nextFaturaId}']`);
        if (nextInput) nextInput.focus();
      }, 100);
    }
  }
};

/**
 * Verifica se um elemento está visível na viewport
 * @param {HTMLElement} element - Elemento a ser verificado
 * @returns {Boolean} - true se o elemento estiver visível
 */
const isElementInViewport = (element) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};