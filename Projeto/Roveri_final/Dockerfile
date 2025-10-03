FROM node:20

WORKDIR /app

# Copiar só os arquivos de dependências primeiro
COPY package.json package-lock.json* ./

# Instalar dependências no container (Linux)
RUN npm install

# Agora copiar o resto do código
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
