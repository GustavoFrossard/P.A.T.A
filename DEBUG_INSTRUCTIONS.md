# 🐛 Debug de Autenticação - Instruções

## Problema Identificado
Erro 401 (Unauthorized) em todas as requisições autenticadas, indicando que os tokens JWT não estão sendo enviados ou validados corretamente.

## Correções Aplicadas

### 1. **api.js** - Corrigido interceptor de refresh
- ✅ Removida URL hardcoded `https://pata2.vercel.app/api/token/refresh/`
- ✅ Agora usa `api.post("token/refresh/", ...)` com baseURL configurada
- ✅ Adicionado CSRF token no header da requisição de refresh
- ✅ Adicionados logs extensivos para debug
- ✅ Limpeza de cookies inválidos quando refresh falha

### 2. **AuthContext.jsx** - Adicionados logs de debug
- ✅ Logs em cada etapa do processo de autenticação
- ✅ Verificação de cookies antes e depois de cada operação
- ✅ Melhor visibilidade do fluxo de autenticação

### 3. **Debug Helper**
- ✅ Adicionada função `window.debugCookies()` no console

## Como Testar

### 1. Abra o Console do Navegador (F12)
Você verá logs detalhados em cada operação:

```
🔐 Tentando fazer login...
🍪 Cookies antes do login: ...
📤 Request para: https://pata2.vercel.app/api/accounts/login/
✅ Login bem-sucedido: {user: {...}, access: "...", refresh: "..."}
🍪 Cookies após login: access_token=...; refresh_token=...
```

### 2. Execute `window.debugCookies()` no Console
Isso mostrará todos os cookies atuais:

```javascript
window.debugCookies()
```

### 3. Verifique os Logs de Requisições
Cada requisição mostrará:
- 📤 URL da requisição
- 🍪 Presença de CSRF Token
- 🍪 Presença de Access Token

## Possíveis Problemas e Soluções

### ❌ Problema: "Cookies ausentes após login"
**Causa:** Backend não está configurando cookies com SameSite=None e Secure=true

**Solução:** Verificar se o backend está em produção (HTTPS). Os cookies com `SameSite=None` precisam de `Secure=true`, que só funciona em HTTPS.

**Teste local:**
```bash
# Se estiver testando localmente, você pode precisar desabilitar SameSite temporariamente
# no backend (Roveriback_final/accounts/views.py)
# Mudar de samesite="None" para samesite="Lax" em desenvolvimento local
```

### ❌ Problema: "CSRF Token ausente"
**Causa:** Django não está enviando o CSRF cookie

**Solução:** 
1. Faça uma requisição GET para qualquer endpoint primeiro
2. Ou force o Django a enviar o cookie adicionando a decoração `@ensure_csrf_cookie`

### ❌ Problema: "Cookies não são enviados nas requisições"
**Causa:** CORS não está configurado corretamente ou domínio não está em CSRF_TRUSTED_ORIGINS

**Verificar no backend (`settings.py`):**
```python
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://seu-dominio-frontend.vercel.app",  # Adicione seu domínio
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "https://seu-dominio-frontend.vercel.app",  # Adicione seu domínio
]
```

### ❌ Problema: "Refresh token não funciona"
**Causa:** Cookie `refresh_token` não está sendo enviado ou está expirado

**Verificar:**
1. Execute `window.debugCookies()` e veja se `refresh_token` está presente
2. Verifique se o cookie não expirou (7 dias por padrão)
3. Verifique se o backend está lendo o cookie corretamente em `CookieTokenRefreshView`

## Checklist de Verificação

- [ ] 1. Faça login e verifique se os cookies são criados (`window.debugCookies()`)
- [ ] 2. Verifique se `access_token` e `refresh_token` aparecem
- [ ] 3. Verifique se as requisições subsequentes mostram "Access Token: Presente"
- [ ] 4. Se token expirar, verifique se o refresh automático funciona
- [ ] 5. Verifique se após refresh, o `access_token` é atualizado

## Comandos Úteis de Debug

```javascript
// Ver todos os cookies
window.debugCookies()

// Ver token armazenado no localStorage
console.log(JSON.parse(localStorage.getItem('roveri_user')))

// Ver último erro de auth
console.log(JSON.parse(localStorage.getItem('auth_last_error')))

// Ver última resposta de auth
console.log(JSON.parse(localStorage.getItem('auth_last_response')))

// Limpar tudo e recomeçar
localStorage.clear()
document.cookie.split(";").forEach(c => {
  document.cookie = c.trim().split("=")[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/';
})
location.reload()
```

## Próximos Passos

1. **Teste o login** e observe os logs no console
2. **Copie e cole os logs aqui** se ainda houver erro
3. **Execute `window.debugCookies()`** e me envie o resultado
4. **Verifique o Network tab** (aba Network no F12) para ver os headers das requisições

## Notas Importantes

⚠️ **HTTPS é obrigatório em produção** quando usando `SameSite=None`
⚠️ **Cookies HttpOnly** não aparecem em `document.cookie` (isso é normal e seguro)
⚠️ **Backend e Frontend** devem estar em `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS`
