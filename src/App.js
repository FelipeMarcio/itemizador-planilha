import React, { useState } from 'react';
import ExcelUploadTab from './ExcelUploadTab';
import ManualItemizationTab from './ManualItemizationTab';

function App() {
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' ou 'excel'
  
  const [originalItems, setOriginalItems] = useState('');
  const [mask, setMask] = useState('XXXX.XX.XX.XX.XX.XX');
  const [startNumber, setStartNumber] = useState('1');
  const [newItems, setNewItems] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [corrections, setCorrections] = useState([]);
  const [showCorrections, setShowCorrections] = useState(false);
  
  // Estados para editor de máscara
  const [showMaskEditor, setShowMaskEditor] = useState(false);
  const [customMask, setCustomMask] = useState('');
  const [savedMasks, setSavedMasks] = useState([
    { name: 'Padrão', mask: 'XXXX.XX.XX.XX.XX.XX' },
    { name: 'Simples', mask: 'XX.XX.XX' },
    { name: 'Com Hífen', mask: 'XXXX-XX-XX' },
    { name: 'Item', mask: 'Item XXXX.XX' }
  ]);

  // Função para incrementar com carry (vai um)
  const incrementWithCarry = (sequenceParts) => {
    const newParts = [...sequenceParts];
    let carry = 1; // Começar com carry de 1
    
    // Percorrer de trás para frente (do último nível para o primeiro)
    for (let i = newParts.length - 1; i >= 0; i--) {
      const currentValue = parseInt(newParts[i]) || 0;
      const newValue = currentValue + carry;
      
      if (newValue > 99) {
        // Se passar de 99, vai um para o nível anterior
        newParts[i] = '01'; // Nunca usar 00
        carry = 1; // Continuar o carry
      } else {
        // Se não passar de 99, usar o valor e parar o carry
        newParts[i] = newValue.toString().padStart(2, '0');
        carry = 0; // Parar o carry
        break;
      }
    }
    
    // Se ainda há carry após processar todos os níveis, adicionar novo nível
    if (carry > 0) {
      newParts.unshift('01');
    }
    
    return newParts;
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
    
    // Se não há número inicial ou está vazio, usar modo sem número inicial
    const useStartNumber = startNumber && startNumber.trim() !== '';
    const actualStartNumber = useStartNumber ? startNumber : '';
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i].trim();
      
      // Se a linha está vazia, usar a estrutura anterior
      if (!item) {
        if (lastValidStructure.length > 0) {
          // Incrementar o último nível da estrutura anterior com carry
          const newStructure = incrementWithCarry(lastValidStructure);
          
          const formattedStartNumber = useStartNumber ? actualStartNumber.padStart(startNumberPart.length, '0') : '';
          const newItem = useStartNumber ? `${formattedStartNumber}.${newStructure.join('.')}` : newStructure.join('.');
          
          // Verificar se já existe e ajustar se necessário
          let counter = 1;
          let finalItem = newItem;
          while (usedSequences.has(finalItem)) {
            newStructure = incrementWithCarry(newStructure);
            finalItem = useStartNumber ? `${formattedStartNumber}.${newStructure.join('.')}` : newStructure.join('.');
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
          const formattedStartNumber = useStartNumber ? actualStartNumber.padStart(startNumberPart.length, '0') : '';
          const basicStructure = levelParts.map(part => '01');
          const basicItem = useStartNumber ? `${formattedStartNumber}.${basicStructure.join('.')}` : basicStructure.join('.');
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
        const formattedStartNumber = useStartNumber ? actualStartNumber.padStart(startNumberPart.length, '0') : '';
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
        
        newItem = useStartNumber ? `${formattedStartNumber}.${sequenceParts.join('.')}` : sequenceParts.join('.');
        
        // Verificar se já existe e ajustar se necessário
        let counter = 1;
        while (usedSequences.has(newItem)) {
          // Se já existe, incrementar com carry (vai um)
          sequenceParts = incrementWithCarry(sequenceParts);
          newItem = useStartNumber ? `${formattedStartNumber}.${sequenceParts.join('.')}` : sequenceParts.join('.');
          counter++;
          
          if (counter > 100) break; // Evitar loop infinito
        }
        
        usedSequences.add(newItem);
        lastValidStructure = sequenceParts; // Atualizar última estrutura válida
      } else {
        const formattedStartNumber = useStartNumber ? actualStartNumber.padStart(startNumberPart.length, '0') : '';
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

      // Dividir os itens originais em linhas (mantendo linhas vazias para processamento)
      const items = originalItems.split('\n');
      
      // Verificar se há pelo menos um item não vazio
      const nonEmptyItems = items.filter(item => item.trim());
      if (nonEmptyItems.length === 0) {
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
    setMask('XXXX.XX.XX.XX.XX.XX');
    setStartNumber('1');
    setNewItems([]);
    setError('');
    setSuccess('');
    setCorrections([]);
    setShowCorrections(false);
  };

  // Função para salvar máscara personalizada
  const saveCustomMask = () => {
    if (!customMask.trim()) {
      setError('Por favor, insira uma máscara válida.');
      return;
    }

    const maskName = prompt('Digite um nome para esta máscara:');
    if (!maskName) return;

    const newMask = { name: maskName, mask: customMask.trim() };
    setSavedMasks([...savedMasks, newMask]);
    setMask(customMask.trim());
    setShowMaskEditor(false);
    setCustomMask('');
    setSuccess(`Máscara "${maskName}" salva e aplicada com sucesso!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Função para aplicar máscara salva
  const applySavedMask = (maskValue) => {
    setMask(maskValue);
    setSuccess('Máscara aplicada com sucesso!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Função para deletar máscara salva
  const deleteSavedMask = (index) => {
    if (window.confirm('Tem certeza que deseja deletar esta máscara?')) {
      const newMasks = savedMasks.filter((_, i) => i !== index);
      setSavedMasks(newMasks);
      setSuccess('Máscara deletada com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    }
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

    // Usar os mesmos itens que foram processados (incluindo linhas vazias)
    const items = originalItems.split('\n');
    let comparisonText = 'Original\tNova Itemização\n';
    comparisonText += '--------\t---------------\n';
    
    for (let i = 0; i < Math.max(items.length, newItems.length); i++) {
      const original = items[i] || '';
      const novo = newItems[i] || '';
      
      // Se a linha original está vazia, mostrar como "(linha vazia)"
      const originalDisplay = original.trim() === '' ? '(linha vazia)' : original;
      
      comparisonText += `${originalDisplay}\t${novo}\n`;
    }

    navigator.clipboard.writeText(comparisonText).then(() => {
      setSuccess('Comparação copiada para a área de transferência!');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Erro ao copiar comparação.');
    });
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Itemizador de Planilhas</h1>
        <p>Transforme suas sequências de itens com máscaras personalizadas</p>
      </div>

      {/* Sistema de Abas */}
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          Itemização Manual
        </button>
        <button 
          className={`tab-button ${activeTab === 'excel' ? 'active' : ''}`}
          onClick={() => setActiveTab('excel')}
        >
          Upload de Excel
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="tab-content">
        {activeTab === 'manual' && (
          <ManualItemizationTab 
            originalItems={originalItems}
            setOriginalItems={setOriginalItems}
            mask={mask}
            setMask={setMask}
            startNumber={startNumber}
            setStartNumber={setStartNumber}
            newItems={newItems}
            setNewItems={setNewItems}
            error={error}
            setError={setError}
            success={success}
            setSuccess={setSuccess}
            corrections={corrections}
            setCorrections={setCorrections}
            showCorrections={showCorrections}
            setShowCorrections={setShowCorrections}
            showMaskEditor={showMaskEditor}
            setShowMaskEditor={setShowMaskEditor}
            customMask={customMask}
            setCustomMask={setCustomMask}
            savedMasks={savedMasks}
            setSavedMasks={setSavedMasks}
            incrementWithCarry={incrementWithCarry}
            analyzeAndCorrectSequence={analyzeAndCorrectSequence}
            generateNewItems={generateNewItems}
            clearAll={clearAll}
            saveCustomMask={saveCustomMask}
            applySavedMask={applySavedMask}
            deleteSavedMask={deleteSavedMask}
            copyResults={copyResults}
            copyComparison={copyComparison}
          />
        )}
        
        {activeTab === 'excel' && (
          <ExcelUploadTab />
        )}
      </div>
    </div>
  );
}

export default App;
