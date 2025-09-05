import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('itemizacao');
  const [originalItems, setOriginalItems] = useState('');
  const [mask, setMask] = useState('XXXX.XX.XX.XX');
  const [startNumber, setStartNumber] = useState('1');
  const [newItems, setNewItems] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [corrections, setCorrections] = useState([]);
  const [showCorrections, setShowCorrections] = useState(false);
  
  // Estado para a planilha
  const [spreadsheetData, setSpreadsheetData] = useState(() => {
    // Inicializar com 2000 linhas e 6 colunas
    const rows = [];
    for (let i = 0; i < 2000; i++) {
      const row = [];
      for (let j = 0; j < 6; j++) {
        row.push('');
      }
      rows.push(row);
    }
    return rows;
  });

  // Estados para seleção
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [activeCell, setActiveCell] = useState({ row: 0, col: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [activeColumn, setActiveColumn] = useState(null); // Nova variável para coluna ativa

  // Refs para navegação
  const spreadsheetRef = useRef(null);
  const cellRefs = useRef({});

  // Função para atualizar célula da planilha
  const updateCell = (rowIndex, colIndex, value) => {
    const newData = [...spreadsheetData];
    newData[rowIndex][colIndex] = value;
    setSpreadsheetData(newData);
  };

  // Função para colar dados na planilha
  const pasteData = async () => {
    try {
      const clipboardData = await navigator.clipboard.readText();
      if (!clipboardData.trim()) {
        setError('Nenhum dado encontrado na área de transferência.');
        return;
      }

      // Se uma coluna está ativa, colar nela
      if (activeColumn !== null) {
        await pasteColumn(activeColumn);
        return;
      }

      // Dividir dados por linhas e colunas
      const rows = clipboardData.trim().split('\n');
      const parsedData = rows.map(row => {
        // Suportar tanto tab quanto vírgula como separadores
        if (row.includes('\t')) {
          return row.split('\t');
        } else if (row.includes(',')) {
          return row.split(',').map(cell => cell.trim());
        } else {
          return [row.trim()];
        }
      });

      // Determinar onde colar (começar da célula ativa ou primeira célula)
      const startRow = activeCell.row;
      const startCol = activeCell.col;

      const newData = [...spreadsheetData];
      let maxRow = startRow;
      let maxCol = startCol;

      // Colar dados
      for (let i = 0; i < parsedData.length; i++) {
        const rowIndex = startRow + i;
        if (rowIndex >= 2000) break; // Limite da planilha

        const rowData = parsedData[i];
        for (let j = 0; j < rowData.length; j++) {
          const colIndex = startCol + j;
          if (colIndex >= 6) break; // Limite de colunas

          newData[rowIndex][colIndex] = rowData[j] || '';
          maxRow = Math.max(maxRow, rowIndex);
          maxCol = Math.max(maxCol, colIndex);
        }
      }

      setSpreadsheetData(newData);

      // Selecionar área colada
      const newSelection = new Set();
      for (let r = startRow; r <= maxRow; r++) {
        for (let c = startCol; c <= maxCol; c++) {
          newSelection.add(`${r}-${c}`);
        }
      }
      setSelectedCells(newSelection);

      setSuccess(`Dados colados com sucesso! (${parsedData.length} linhas)`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao colar dados: ' + err.message);
    }
  };

  // Função para colar dados em coluna específica
  const pasteColumn = async (colIndex) => {
    try {
      const clipboardData = await navigator.clipboard.readText();
      if (!clipboardData.trim()) {
        setError('Nenhum dado encontrado na área de transferência.');
        return;
      }

      // Detectar tipo de conteúdo
      const contentType = detectContentType(clipboardData);
      const newData = [...spreadsheetData];

      if (contentType === 'description') {
        // Perguntar ao usuário como quer colar
        const shouldPasteAsDescription = window.confirm(
          `Detectamos que você está colando uma descrição com quebras de linha.\n\n` +
          `Como deseja colar?\n\n` +
          `• OK = Colar como descrição (uma célula)\n` +
          `• Cancelar = Colar como dados tabulares (múltiplas linhas)`
        );
        
        if (shouldPasteAsDescription) {
          // Colar como descrição em uma única célula
          const targetRow = activeCell.row;
          newData[targetRow][colIndex] = clipboardData.trim();
          setSelectedCells(new Set([`${targetRow}-${colIndex}`]));
          setSuccess(`Descrição colada na célula ${String.fromCharCode(65 + colIndex)}${targetRow + 1}!`);
        } else {
          // Colar como dados tabulares
          const rows = clipboardData.trim().split('\n');
          for (let i = 0; i < Math.min(rows.length, 2000); i++) {
            newData[i][colIndex] = rows[i].trim();
          }
          const newSelection = new Set();
          for (let r = 0; r < Math.min(rows.length, 2000); r++) {
            newSelection.add(`${r}-${colIndex}`);
          }
          setSelectedCells(newSelection);
          setSuccess(`Coluna ${String.fromCharCode(65 + colIndex)} preenchida com ${Math.min(rows.length, 2000)} itens!`);
        }
      } else {
        // Colar como dados tabulares
        const rows = clipboardData.trim().split('\n');
        for (let i = 0; i < Math.min(rows.length, 2000); i++) {
          newData[i][colIndex] = rows[i].trim();
        }
        const newSelection = new Set();
        for (let r = 0; r < Math.min(rows.length, 2000); r++) {
          newSelection.add(`${r}-${colIndex}`);
        }
        setSelectedCells(newSelection);
        setSuccess(`Coluna ${String.fromCharCode(65 + colIndex)} preenchida com ${Math.min(rows.length, 2000)} itens!`);
      }

      setSpreadsheetData(newData);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao colar dados na coluna: ' + err.message);
    }
  };

  // Função para colar descrição em uma única célula
  const pasteDescription = async (colIndex) => {
    try {
      const clipboardData = await navigator.clipboard.readText();
      if (!clipboardData.trim()) {
        setError('Nenhum dado encontrado na área de transferência.');
        return;
      }

      const newData = [...spreadsheetData];
      
      // Determinar em qual linha colar baseado na célula ativa
      const targetRow = activeCell.row;
      
      // Colar toda a descrição em uma única célula na linha correta
      newData[targetRow][colIndex] = clipboardData.trim();
      
      // Selecionar apenas a célula onde foi colado
      setSelectedCells(new Set([`${targetRow}-${colIndex}`]));
      
      setSpreadsheetData(newData);
      setSuccess(`Descrição colada na célula ${String.fromCharCode(65 + colIndex)}${targetRow + 1}!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao colar descrição: ' + err.message);
    }
  };

  // Função para lidar com menu de contexto (botão direito)
  const handleContextMenu = (e) => {
    e.preventDefault();
    
    // Criar menu de contexto personalizado
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
      <div class="context-menu-item" onclick="window.pasteFromContextMenu()">
        <span>📋 Colar</span>
        <span class="shortcut">Ctrl+V</span>
      </div>
      <div class="context-menu-item" onclick="window.copyFromContextMenu()">
        <span>📄 Copiar</span>
        <span class="shortcut">Ctrl+C</span>
      </div>
      <div class="context-menu-item" onclick="window.selectAllFromContextMenu()">
        <span>☑️ Selecionar Tudo</span>
        <span class="shortcut">Ctrl+A</span>
      </div>
      <div class="context-menu-item" onclick="window.clearSelectionFromContextMenu()">
        <span>🗑️ Limpar Seleção</span>
      </div>
    `;
    
    // Posicionar menu
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';
    contextMenu.style.zIndex = '1000';
    
    // Adicionar ao DOM
    document.body.appendChild(contextMenu);
    
    // Remover menu ao clicar fora
    const removeMenu = () => {
      document.body.removeChild(contextMenu);
      document.removeEventListener('click', removeMenu);
    };
    
    setTimeout(() => {
      document.addEventListener('click', removeMenu);
    }, 100);
  };

  // Função para lidar com eventos de teclado global
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Só processar se estiver na aba da planilha
      if (activeTab === 'planilha') {
        if (e.ctrlKey || e.metaKey) {
          switch (e.key.toLowerCase()) {
            case 'v':
              e.preventDefault();
              pasteData();
              break;
            case 'c':
              e.preventDefault();
              copySelectedData();
              break;
            case 'a':
              e.preventDefault();
              selectAll();
              break;
          }
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    
    // Expor funções para o menu de contexto
    window.pasteFromContextMenu = pasteData;
    window.copyFromContextMenu = copySelectedData;
    window.selectAllFromContextMenu = selectAll;
    window.clearSelectionFromContextMenu = clearSelection;

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
      delete window.pasteFromContextMenu;
      delete window.copyFromContextMenu;
      delete window.selectAllFromContextMenu;
      delete window.clearSelectionFromContextMenu;
    };
  }, [activeTab, activeColumn, activeCell, selectedCells, spreadsheetData]);

  // Função para navegar com teclado
  const handleKeyDown = (e) => {
    if (!isEditing) {
      const { row, col } = activeCell;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (row > 0) {
            setActiveCell({ row: row - 1, col });
            focusCell(row - 1, col);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (row < 1999) {
            setActiveCell({ row: row + 1, col });
            focusCell(row + 1, col);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (col > 0) {
            setActiveCell({ row, col: col - 1 });
            focusCell(row, col - 1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (col < 5) {
            setActiveCell({ row, col: col + 1 });
            focusCell(row, col + 1);
          }
          break;
        case 'Enter':
          e.preventDefault();
          setIsEditing(true);
          focusCell(row, col);
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            copySelectedData();
          }
          break;
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            pasteData();
          }
          break;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            selectAll();
          }
          break;
      }
    }
  };

  // Função para focar célula
  const focusCell = (rowIndex, colIndex) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const cellElement = cellRefs.current[cellKey];
    if (cellElement) {
      cellElement.focus();
    }
  };

  // Função para selecionar célula
  const selectCell = (rowIndex, colIndex) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const newSelection = new Set(selectedCells);
    
    if (newSelection.has(cellKey)) {
      newSelection.delete(cellKey);
    } else {
      newSelection.add(cellKey);
    }
    
    setSelectedCells(newSelection);
    setActiveCell({ row: rowIndex, col: colIndex });
    setActiveColumn(null); // Limpar coluna ativa ao selecionar célula
  };

  // Função para selecionar coluna inteira
  const selectColumn = (colIndex) => {
    const newSelection = new Set();
    for (let rowIndex = 0; rowIndex < spreadsheetData.length; rowIndex++) {
      newSelection.add(`${rowIndex}-${colIndex}`);
    }
    setSelectedCells(newSelection);
    setActiveCell({ row: 0, col: colIndex });
    setActiveColumn(colIndex); // Definir coluna ativa
  };

  // Função para selecionar linha inteira
  const selectRow = (rowIndex) => {
    const newSelection = new Set();
    for (let colIndex = 0; colIndex < 6; colIndex++) {
      newSelection.add(`${rowIndex}-${colIndex}`);
    }
    setSelectedCells(newSelection);
    setActiveCell({ row: rowIndex, col: 0 });
    setActiveColumn(null); // Limpar coluna ativa ao selecionar linha
  };

  // Função para iniciar seleção múltipla
  const startSelection = (rowIndex, colIndex) => {
    setIsSelecting(true);
    setSelectionStart({ rowIndex, colIndex });
    setSelectedCells(new Set([`${rowIndex}-${colIndex}`]));
    setActiveCell({ row: rowIndex, col: colIndex });
    setActiveColumn(null); // Limpar coluna ativa ao iniciar seleção
  };

  // Função para atualizar seleção múltipla
  const updateSelection = (rowIndex, colIndex) => {
    if (!isSelecting || !selectionStart) return;
    
    const newSelection = new Set();
    const startRow = Math.min(selectionStart.rowIndex, rowIndex);
    const endRow = Math.max(selectionStart.rowIndex, rowIndex);
    const startCol = Math.min(selectionStart.colIndex, colIndex);
    const endCol = Math.max(selectionStart.colIndex, colIndex);
    
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        newSelection.add(`${r}-${c}`);
      }
    }
    
    setSelectedCells(newSelection);
  };

  // Função para finalizar seleção
  const endSelection = () => {
    setIsSelecting(false);
    setSelectionStart(null);
  };

  // Função para verificar se célula está selecionada
  const isCellSelected = (rowIndex, colIndex) => {
    return selectedCells.has(`${rowIndex}-${colIndex}`);
  };

  // Função para verificar se célula está ativa
  const isCellActive = (rowIndex, colIndex) => {
    return activeCell.row === rowIndex && activeCell.col === colIndex;
  };

  // Função para verificar se coluna está ativa
  const isColumnActive = (colIndex) => {
    return activeColumn === colIndex;
  };

  // Função para copiar dados selecionados
  const copySelectedData = () => {
    if (selectedCells.size === 0) {
      setError('Nenhuma célula selecionada para copiar.');
      return;
    }

    // Organizar dados selecionados por linha e coluna
    const selectedData = [];
    const maxRow = Math.max(...Array.from(selectedCells).map(key => parseInt(key.split('-')[0])));
    const maxCol = Math.max(...Array.from(selectedCells).map(key => parseInt(key.split('-')[1])));
    
    for (let rowIndex = 0; rowIndex <= maxRow; rowIndex++) {
      const rowData = [];
      for (let colIndex = 0; colIndex <= maxCol; colIndex++) {
        const cellKey = `${rowIndex}-${colIndex}`;
        if (selectedCells.has(cellKey)) {
          rowData.push(spreadsheetData[rowIndex][colIndex] || '');
        }
      }
      if (rowData.length > 0) {
        selectedData.push(rowData.join('\t'));
      }
    }

    const dataToCopy = selectedData.join('\n');
    
    navigator.clipboard.writeText(dataToCopy).then(() => {
      setSuccess(`Dados selecionados copiados! (${selectedCells.size} células)`);
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Erro ao copiar dados selecionados.');
    });
  };

  // Função para limpar seleção
  const clearSelection = () => {
    setSelectedCells(new Set());
  };

  // Função para selecionar tudo
  const selectAll = () => {
    const newSelection = new Set();
    for (let rowIndex = 0; rowIndex < spreadsheetData.length; rowIndex++) {
      for (let colIndex = 0; colIndex < 6; colIndex++) {
        newSelection.add(`${rowIndex}-${colIndex}`);
      }
    }
    setSelectedCells(newSelection);
  };

  // Função para analisar e corrigir sequência
  const analyzeAndCorrectSequence = (items) => {
    const corrections = [];
    const correctedItems = [];
    const usedSequences = new Set(); // Para rastrear sequências já usadas
    let lastValidStructure = []; // Última estrutura válida encontrada
    
    // Analisar a máscara para determinar o formato
    const maskParts = mask.split('.');
    const startNumberPart = maskParts[0] || 'XXXX';
    const levelParts = maskParts.slice(1);
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i].trim();
      
      // Se a linha está vazia, usar a estrutura anterior
      if (!item) {
        if (lastValidStructure.length > 0) {
          // Incrementar o último nível da estrutura anterior
          const newStructure = [...lastValidStructure];
          const lastLevel = newStructure.length - 1;
          const lastValue = parseInt(newStructure[lastLevel]) || 0;
          newStructure[lastLevel] = (lastValue + 1).toString().padStart(2, '0');
          
          const formattedStartNumber = startNumber.padStart(startNumberPart.length, '0');
          const newItem = `${formattedStartNumber}.${newStructure.join('.')}`;
          
          // Verificar se já existe e ajustar se necessário
          let counter = 1;
          let finalItem = newItem;
          while (usedSequences.has(finalItem)) {
            const incrementedValue = parseInt(newStructure[lastLevel]) + counter;
            newStructure[lastLevel] = incrementedValue.toString().padStart(2, '0');
            finalItem = `${formattedStartNumber}.${newStructure.join('.')}`;
            counter++;
            if (counter > 100) break; // Evitar loop infinito
          }
          
          usedSequences.add(finalItem);
          correctedItems.push(finalItem);
          lastValidStructure = newStructure;
          
          corrections.push({
            original: '(linha vazia)',
            corrected: finalItem,
            error: 'Linha vazia - sequência continuada automaticamente'
          });
        } else {
          // Se não há estrutura anterior, usar estrutura básica baseada na máscara
          const formattedStartNumber = startNumber.padStart(startNumberPart.length, '0');
          const basicStructure = levelParts.map(part => '01');
          const basicItem = `${formattedStartNumber}.${basicStructure.join('.')}`;
          correctedItems.push(basicItem);
          lastValidStructure = basicStructure;
          
          corrections.push({
            original: '(linha vazia)',
            corrected: basicItem,
            error: 'Linha vazia - estrutura básica aplicada'
          });
        }
        continue;
      }
      
      const numbers = item.split('.').map(num => parseInt(num) || 0);
      
      // Verificar se há problemas na sequência
      let hasError = false;
      let errorDescription = '';
      
      for (let j = 0; j < numbers.length; j++) {
        if (numbers[j] < 0) {
          hasError = true;
          errorDescription = `Número negativo encontrado: ${numbers[j]}`;
          numbers[j] = 1;
        }
      }
      
      // Criar nova itemização hierárquica baseada na máscara
      let newItem;
      
      if (numbers.length > 0) {
        const formattedStartNumber = startNumber.padStart(startNumberPart.length, '0');
        let sequenceParts = [];
        
        // Determinar quantos níveis temos baseado na máscara
        const numLevels = Math.min(numbers.length, levelParts.length);
        
        if (i === 0 || lastValidStructure.length === 0) {
          // Primeiro item ou após reset: usar estrutura básica baseada na máscara
          for (let level = 0; level < numLevels; level++) {
            sequenceParts.push('01');
          }
        } else {
          // Itens subsequentes: analisar estrutura anterior
          const prevLevels = lastValidStructure.length;
          
          if (numLevels <= prevLevels) {
            // Mesmo nível ou menor: continuar sequência
            for (let level = 0; level < numLevels; level++) {
              if (level < prevLevels) {
                sequenceParts.push(lastValidStructure[level]); // Manter estrutura anterior
              } else {
                // Último nível: incrementar sequência baseado no valor original
                const originalValue = numbers[level];
                sequenceParts.push(originalValue.toString().padStart(2, '0'));
              }
            }
          } else {
            // Mais níveis: expandir estrutura
            for (let level = 0; level < numLevels; level++) {
              if (level < prevLevels) {
                sequenceParts.push(lastValidStructure[level]); // Manter estrutura anterior
              } else {
                // Novos níveis: usar valor original
                const originalValue = numbers[level];
                sequenceParts.push(originalValue.toString().padStart(2, '0'));
              }
            }
          }
        }
        
        newItem = `${formattedStartNumber}.${sequenceParts.join('.')}`;
        
        // Verificar se já existe e ajustar se necessário
        let counter = 1;
        while (usedSequences.has(newItem)) {
          // Se já existe, incrementar o último nível
          const lastPart = parseInt(sequenceParts[sequenceParts.length - 1]) || 0;
          sequenceParts[sequenceParts.length - 1] = (lastPart + 1).toString().padStart(2, '0');
          newItem = `${formattedStartNumber}.${sequenceParts.join('.')}`;
          counter++;
          
          if (counter > 100) break; // Evitar loop infinito
        }
        
        usedSequences.add(newItem);
        lastValidStructure = sequenceParts; // Atualizar última estrutura válida
      } else {
        const formattedStartNumber = startNumber.padStart(startNumberPart.length, '0');
        newItem = formattedStartNumber;
        lastValidStructure = [];
      }
      
      correctedItems.push(newItem);
      
      if (hasError) {
        corrections.push({
          original: item,
          corrected: newItem,
          error: errorDescription
        });
      }
    }
    
    return { correctedItems, corrections };
  };

  // Função para gerar nova itemização baseada na máscara
  const generateNewItems = () => {
    try {
      setError('');
      setSuccess('');
      setCorrections([]);
      setShowCorrections(false);

      if (!originalItems.trim()) {
        setError('Por favor, insira os itens originais.');
        return;
      }

      if (!mask.trim()) {
        setError('Por favor, insira uma máscara válida.');
        return;
      }

      // Dividir os itens originais em linhas
      const items = originalItems.trim().split('\n');
      
      if (items.length === 0) {
        setError('Nenhum item válido encontrado.');
        return;
      }

      // Analisar e corrigir sequência
      const { correctedItems, corrections } = analyzeAndCorrectSequence(items);

      setNewItems(correctedItems);
      setCorrections(corrections);
      
      let successMessage = `Itemização gerada com sucesso! ${correctedItems.length} itens criados.`;
      if (corrections.length > 0) {
        successMessage += ` ${corrections.length} correções automáticas aplicadas.`;
      }
      setSuccess(successMessage);
    } catch (err) {
      setError('Erro ao gerar itemização: ' + err.message);
    }
  };

  // Função para limpar todos os campos
  const clearAll = () => {
    setOriginalItems('');
    setMask('XXXX.XX.XX.XX');
    setStartNumber('1');
    setNewItems([]);
    setError('');
    setSuccess('');
    setCorrections([]);
    setShowCorrections(false);
  };

  // Função para copiar resultados
  const copyResults = () => {
    if (newItems.length === 0) {
      setError('Nenhum resultado para copiar.');
      return;
    }

    const textToCopy = newItems.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setSuccess('Resultados copiados para a área de transferência!');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Erro ao copiar para a área de transferência.');
    });
  };

  // Função para copiar comparação lado a lado
  const copyComparison = () => {
    if (newItems.length === 0) {
      setError('Nenhum resultado para copiar.');
      return;
    }

    const originalItemsList = originalItems.trim().split('\n').filter(item => item.trim());
    let comparisonText = 'Original\tNova Itemização\n';
    comparisonText += '--------\t---------------\n';
    
    for (let i = 0; i < Math.max(originalItemsList.length, newItems.length); i++) {
      const original = originalItemsList[i] || '';
      const novo = newItems[i] || '';
      comparisonText += `${original}\t${novo}\n`;
    }

    navigator.clipboard.writeText(comparisonText).then(() => {
      setSuccess('Comparação copiada para a área de transferência!');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Erro ao copiar comparação.');
    });
  };

  // Função para limpar planilha
  const clearSpreadsheet = () => {
    const newData = spreadsheetData.map(row => row.map(() => ''));
    setSpreadsheetData(newData);
  };

  // Função para copiar dados da planilha
  const copySpreadsheetData = () => {
    const dataToCopy = spreadsheetData
      .map(row => row.join('\t'))
      .join('\n');
    
    navigator.clipboard.writeText(dataToCopy).then(() => {
      setSuccess('Dados da planilha copiados para a área de transferência!');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Erro ao copiar dados da planilha.');
    });
  };

  // Função para detectar se o conteúdo é uma descrição ou dados tabulares
  const detectContentType = (clipboardData) => {
    const rows = clipboardData.trim().split('\n');
    const hasLineBreaks = clipboardData.includes('\n');
    
    // Se não tem quebras de linha, é definitivamente dados tabulares
    if (!hasLineBreaks) {
      return 'tabular';
    }
    
    // Se tem muitas linhas, é provavelmente dados tabulares
    if (rows.length > 10) {
      return 'tabular';
    }
    
    // Se tem poucas linhas mas cada linha é relativamente curta, pode ser dados tabulares
    const avgLineLength = rows.reduce((sum, row) => sum + row.length, 0) / rows.length;
    if (rows.length <= 5 && avgLineLength < 50) {
      return 'tabular';
    }
    
    // Se tem quebras de linha mas o texto é longo e tem poucas linhas, é provavelmente uma descrição
    if (hasLineBreaks && rows.length <= 3 && clipboardData.length > 100) {
      return 'description';
    }
    
    // Padrão padrão: dados tabulares
    return 'tabular';
  };

  // Componente da aba de itemização
  const ItemizacaoTab = () => (
    <div className="tab-content">
      <div className="form-section">
        <h2>Configurações de Formatação</h2>
        <div className="config-grid">
          <div className="form-group">
            <label htmlFor="startNumber">
              Número inicial da sequência:
            </label>
            <input
              id="startNumber"
              type="text"
              value={startNumber}
              onChange={(e) => setStartNumber(e.target.value)}
              placeholder="Exemplo: 1 ou 0177"
            />
            <div className="help-text">
              Número que iniciará a nova sequência (será formatado com zeros à esquerda)
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="mask">
              Máscara de formatação (use X para números):
            </label>
            <input
              id="mask"
              type="text"
              value={mask}
              onChange={(e) => setMask(e.target.value)}
              placeholder="Exemplo: XXXX.XX.XX.XX"
            />
            <div className="mask-example">
              <strong>Exemplos:</strong><br/>
              • XXXX.XX.XX.XX → 0001.01.01.01, 0002.01.01.01, ...<br/>
              • XXXX.XX.XX.XX.XX → 0001.01.01.01.01, 0002.01.01.01.01, ...<br/>
              • XX-XX → 01-01, 02-01, 03-01, ...<br/>
              • Item XXXX → Item 0001, Item 0002, Item 0003, ...
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h2>Comparação Lado a Lado</h2>
        <div className="comparison-container">
          <div className="column">
            <h3>Itemização Original do Cliente</h3>
            <div className="form-group">
              <label htmlFor="originalItems">
                Cole aqui a coluna com a itemização existente:
              </label>
              <textarea
                id="originalItems"
                value={originalItems}
                onChange={(e) => setOriginalItems(e.target.value)}
                placeholder="Exemplo:&#10;1&#10;1.1&#10;1.1.1&#10;1.1.1.1&#10;1.1.1.2&#10;(linha vazia - será 1.1.1.3)&#10;1.2.3.2&#10;2&#10;2.1&#10;2.1.1&#10;2.1.1.1&#10;(linha vazia - será 2.1.1.2)"
              />
              <div className="help-text">
                💡 <strong>Dica:</strong> Linhas vazias serão automaticamente preenchidas continuando a sequência da linha anterior!
              </div>
            </div>
          </div>

          <div className="column">
            <h3>Nova Itemização Modificada</h3>
            <div className="results-display">
              {newItems.length > 0 ? (
                <div className="new-items-list">
                  {newItems.map((item, index) => (
                    <div key={index} className="result-item">
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="placeholder">
                  <p>Nova itemização aparecerá aqui após gerar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {corrections.length > 0 && (
        <div className="form-section">
          <div className="corrections-header">
            <h2>Correções Automáticas Aplicadas ({corrections.length})</h2>
            <button 
              className="button button-warning" 
              onClick={() => setShowCorrections(!showCorrections)}
            >
              {showCorrections ? 'Ocultar Correções' : 'Mostrar Correções'}
            </button>
          </div>
          {showCorrections && (
            <div className="corrections-list">
              {corrections.map((correction, index) => (
                <div key={index} className="correction-item">
                  <div className="correction-original">
                    <strong>Original:</strong> {correction.original}
                  </div>
                  <div className="correction-new">
                    <strong>Corrigido:</strong> {correction.corrected}
                  </div>
                  <div className="correction-error">
                    <strong>Problema:</strong> {correction.error}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="form-section">
        <h2>Ações</h2>
        <button className="button" onClick={generateNewItems}>
          Gerar Nova Itemização
        </button>
        <button className="button button-secondary" onClick={clearAll}>
          Limpar Tudo
        </button>
        {newItems.length > 0 && (
          <>
            <button className="button button-success" onClick={copyResults}>
              Copiar Nova Itemização
            </button>
            <button className="button button-info" onClick={copyComparison}>
              Copiar Comparação
            </button>
          </>
        )}
      </div>
    </div>
  );

  // Componente da aba de planilha
  const PlanilhaTab = () => (
    <div className="tab-content">
      <div className="form-section">
        <h2>Planilha de Dados</h2>
        <p className="spreadsheet-info">
          <strong>Navegação:</strong> Use as setas do teclado para navegar • 
          <strong>Seleção:</strong> Clique no cabeçalho para coluna inteira • 
          <strong>Colagem:</strong> "Colar Dados" para múltiplas linhas • "Colar Descrição" para uma célula • 
          <strong>Menu:</strong> Botão direito para menu de contexto • 
          <strong>Atalhos:</strong> Ctrl+C (copiar), Ctrl+A (selecionar tudo)
        </p>
        
        <div className="spreadsheet-actions">
          <button className="button button-secondary" onClick={clearSpreadsheet}>
            Limpar Planilha
          </button>
          <button className="button button-success" onClick={copySpreadsheetData}>
            Copiar Tudo
          </button>
          <button className="button button-info" onClick={copySelectedData}>
            Copiar Selecionados ({selectedCells.size})
          </button>
                     <button className="button button-primary" onClick={pasteData}>
             Colar Dados
           </button>
           <button className="button button-warning" onClick={() => pasteDescription(activeColumn !== null ? activeColumn : activeCell.col)}>
             Colar Descrição
           </button>
           <button className="button button-warning" onClick={selectAll}>
            Selecionar Tudo
          </button>
          <button className="button button-secondary" onClick={clearSelection}>
            Limpar Seleção
          </button>
        </div>

        <div 
          className="spreadsheet-container"
          ref={spreadsheetRef}
          onKeyDown={handleKeyDown}
          onContextMenu={handleContextMenu}
          tabIndex={0}
        >
          <div className="spreadsheet-header">
            {['A', 'B', 'C', 'D', 'E', 'F'].map((col, colIndex) => (
              <div 
                key={colIndex}
                className={`header-cell ${isColumnActive(colIndex) ? 'active' : ''}`}
                onClick={() => selectColumn(colIndex)}
                onDoubleClick={() => pasteColumn(colIndex)}
                title={`Clique para selecionar coluna ${col} • Clique e pressione Ctrl+V para colar dados`}
              >
                Coluna {col}
              </div>
            ))}
          </div>
          
          <div 
            className="spreadsheet-body"
            onMouseLeave={endSelection}
          >
            {spreadsheetData.map((row, rowIndex) => (
              <div key={rowIndex} className="spreadsheet-row">
                {row.map((cell, colIndex) => (
                  <input
                    key={`${rowIndex}-${colIndex}`}
                    ref={el => cellRefs.current[`${rowIndex}-${colIndex}`] = el}
                    type="text"
                    className={`spreadsheet-cell ${isCellSelected(rowIndex, colIndex) ? 'selected' : ''} ${isCellActive(rowIndex, colIndex) ? 'active' : ''}`}
                    value={cell}
                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                    onClick={() => selectCell(rowIndex, colIndex)}
                    onMouseDown={() => startSelection(rowIndex, colIndex)}
                    onMouseEnter={() => updateSelection(rowIndex, colIndex)}
                    onMouseUp={endSelection}
                    onFocus={() => {
                      setActiveCell({ row: rowIndex, col: colIndex });
                      setIsEditing(true);
                    }}
                    onBlur={() => setIsEditing(false)}
                    placeholder={`Linha ${rowIndex + 1}`}
                    title={`Célula ${rowIndex + 1}-${colIndex + 1} • Clique para selecionar`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className="header">
        <h1>Itemizador de Planilhas</h1>
        <p>Transforme suas sequências de itens com máscaras personalizadas</p>
      </div>

      <div className="content">
        {/* Sistema de abas */}
        <div className="tabs">
          <button 
            className={`tab-button ${activeTab === 'itemizacao' ? 'active' : ''}`}
            onClick={() => setActiveTab('itemizacao')}
          >
            Itemização
          </button>
          <button 
            className={`tab-button ${activeTab === 'planilha' ? 'active' : ''}`}
            onClick={() => setActiveTab('planilha')}
          >
            Planilha
          </button>
        </div>

        {/* Conteúdo das abas */}
        {activeTab === 'itemizacao' && <ItemizacaoTab />}
        {activeTab === 'planilha' && <PlanilhaTab />}

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </div>
    </div>
  );
}

export default App;
