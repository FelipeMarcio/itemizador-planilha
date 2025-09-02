import React, { useState } from 'react';

function App() {
  const [originalItems, setOriginalItems] = useState('');
  const [mask, setMask] = useState('XXXX.XX.XX.XX');
  const [startNumber, setStartNumber] = useState('1');
  const [newItems, setNewItems] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [corrections, setCorrections] = useState([]);
  const [showCorrections, setShowCorrections] = useState(false);

  // Função para analisar e corrigir sequência
  const analyzeAndCorrectSequence = (items) => {
    const corrections = [];
    const correctedItems = [];
    const usedSequences = new Set(); // Para rastrear sequências já usadas
    let previousStructure = []; // Estrutura do item anterior
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i].trim();
      if (!item) continue;
      
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
      
      // Criar nova itemização hierárquica
      let newItem;
      
      if (numbers.length > 0) {
        const formattedStartNumber = startNumber.padStart(4, '0');
        let sequenceParts = [];
        
        // Determinar quantos níveis temos
        const numLevels = numbers.length;
        
        if (i === 0) {
          // Primeiro item: usar estrutura básica
          for (let level = 0; level < numLevels; level++) {
            sequenceParts.push('01');
          }
        } else {
          // Itens subsequentes: analisar estrutura anterior
          const prevLevels = previousStructure.length;
          
          if (numLevels <= prevLevels) {
            // Mesmo nível ou menor: continuar sequência
            for (let level = 0; level < numLevels; level++) {
              if (level < prevLevels) {
                sequenceParts.push(previousStructure[level]); // Manter estrutura anterior
              } else {
                // Último nível: incrementar sequência
                const lastPart = parseInt(previousStructure[prevLevels - 1]) || 0;
                sequenceParts.push((lastPart + 1).toString().padStart(2, '0'));
              }
            }
          } else {
            // Mais níveis: expandir estrutura
            for (let level = 0; level < numLevels; level++) {
              if (level < prevLevels) {
                sequenceParts.push(previousStructure[level]); // Manter estrutura anterior
              } else {
                // Novos níveis: começar com 01
                sequenceParts.push('01');
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
        previousStructure = sequenceParts; // Atualizar estrutura anterior
      } else {
        const formattedStartNumber = startNumber.padStart(4, '0');
        newItem = formattedStartNumber;
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
      const items = originalItems.trim().split('\n').filter(item => item.trim());
      
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

  return (
    <div className="container">
      <div className="header">
        <h1>Itemizador de Planilhas</h1>
        <p>Transforme suas sequências de itens com máscaras personalizadas</p>
      </div>

      <div className="content">
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
                  placeholder="Exemplo:&#10;1&#10;1.1&#10;1.1.1&#10;1.1.1.1&#10;1.1.1.2"
                />
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

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
      </div>
    </div>
  );
}

export default App;
