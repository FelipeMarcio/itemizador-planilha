import React from 'react';

const ManualItemizationTab = ({
  originalItems,
  setOriginalItems,
  mask,
  setMask,
  startNumber,
  setStartNumber,
  newItems,
  setNewItems,
  error,
  setError,
  success,
  setSuccess,
  corrections,
  setCorrections,
  showCorrections,
  setShowCorrections,
  showMaskEditor,
  setShowMaskEditor,
  customMask,
  setCustomMask,
  savedMasks,
  setSavedMasks,
  incrementWithCarry,
  analyzeAndCorrectSequence,
  generateNewItems,
  clearAll,
  saveCustomMask,
  applySavedMask,
  deleteSavedMask,
  copyResults,
  copyComparison
}) => {
  return (
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
            <div className="mask-input-container">
              <input
                id="mask"
                type="text"
                value={mask}
                onChange={(e) => setMask(e.target.value)}
                placeholder="Exemplo: XXXX.XX.XX.XX.XX.XX"
              />
              <button 
                type="button"
                className="button button-small"
                onClick={() => setShowMaskEditor(!showMaskEditor)}
              >
                {showMaskEditor ? 'Fechar Editor' : 'Editor de Máscara'}
              </button>
            </div>
            <div className="mask-example">
              <strong>Exemplos:</strong><br/>
              • XXXX.XX.XX.XX.XX.XX → 0001.01.01.01.01.01, 0002.01.01.01.01.01, ...<br/>
              • XX.XX.XX → 01.01.01, 02.01.01, 03.01.01, ...<br/>
              • XXXX-XX-XX → 0001-01-01, 0002-01-01, 0003-01-01, ...<br/>
              • Item XXXX.XX → Item 0001.01, Item 0002.01, Item 0003.01, ...
            </div>
            <div className="help-text">
              💡 <strong>Dica:</strong> Deixe o número inicial vazio para usar apenas os níveis da máscara (sem XXXX)!
            </div>
          </div>
        </div>
      </div>

      {/* Editor de Máscara */}
      {showMaskEditor && (
        <div className="form-section">
          <h2>Editor de Máscara Personalizada</h2>
          <div className="mask-editor">
            <div className="form-group">
              <label htmlFor="customMask">
                Criar nova máscara:
              </label>
              <input
                id="customMask"
                type="text"
                value={customMask}
                onChange={(e) => setCustomMask(e.target.value)}
                placeholder="Exemplo: XXXX.XX.XX.XX.XX.XX"
              />
              <div className="help-text">
                Use X para números (serão formatados com zeros à esquerda). Use pontos, hífens ou outros separadores.
              </div>
            </div>
            
            <div className="mask-editor-actions">
              <button className="button button-success" onClick={saveCustomMask}>
                Salvar Máscara
              </button>
              <button 
                className="button button-secondary" 
                onClick={() => {
                  setShowMaskEditor(false);
                  setCustomMask('');
                }}
              >
                Cancelar
              </button>
            </div>

            <div className="saved-masks">
              <h3>Máscaras Salvas</h3>
              <div className="saved-masks-list">
                {savedMasks.map((savedMask, index) => (
                  <div key={index} className="saved-mask-item">
                    <div className="mask-info">
                      <strong>{savedMask.name}</strong>
                      <span className="mask-preview">{savedMask.mask}</span>
                    </div>
                    <div className="mask-actions">
                      <button 
                        className="button button-small button-info"
                        onClick={() => applySavedMask(savedMask.mask)}
                      >
                        Aplicar
                      </button>
                      <button 
                        className="button button-small button-secondary"
                        onClick={() => deleteSavedMask(index)}
                      >
                        Deletar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
                placeholder="Exemplo:&#10;1&#10;1.1&#10;1.1.1&#10;1.1.1.1&#10;1.1.1.2&#10;&#10;2&#10;2.1&#10;&#10;3&#10;&#10;4&#10;&#10;&#10;Nota: Linhas vazias serão preenchidas automaticamente!"
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

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );
};

export default ManualItemizationTab;
