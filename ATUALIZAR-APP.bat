@echo off
title Atualizar Itemizador de Planilhas
echo.
echo ========================================
echo    ATUALIZAR ITEMIZADOR DE PLANILHAS
echo ========================================
echo.
echo Parando processos anteriores...
taskkill /f /im node.exe >nul 2>&1

echo.
echo Fazendo build da aplicacao...
npm run build

if %errorlevel% neq 0 (
    echo ERRO: Falha no build!
    pause
    exit /b 1
)

echo.
echo Fazendo deploy para GitHub Pages...
npm run deploy

if %errorlevel% neq 0 (
    echo ERRO: Falha no deploy!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    ATUALIZACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo O app foi atualizado em:
echo https://felipemarcio.github.io/itemizador-planilha/
echo.
echo Todas as pessoas que acessarem o link
echo receberao a versao mais recente!
echo.
pause
