FROM node:20

WORKDIR /app

# Copiar só os arquivos de dependências primeiro
COPY package.json package-lock.json* ./

# Instalar dependências no container (Linux)
RUN npm ci --no-audit --prefer-offline || npm install --no-audit --prefer-offline

# Agora copiar o resto do código
COPY . .

EXPOSE 5173

# Copy entrypoint and make executable
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD ["/usr/local/bin/docker-entrypoint.sh"]

