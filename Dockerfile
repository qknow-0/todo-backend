# 设置基础镜像
FROM node:18

RUN apt-get update && apt-get install gnupg wget -y && \
    wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && \
    apt-get install google-chrome-stable -y --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 将 package.json 和 pnpm-lock.yaml 复制到工作目录
COPY package.json pnpm-lock.yaml ./
COPY Fonts /root/.fonts

# 安装依赖
RUN npm install -g pnpm 
RUN pnpm install --frozen-lockfile

# 将应用程序源代码复制到工作目录
COPY . .

# 暴露应用程序运行的端口号
EXPOSE 3000

RUN npx prisma generate
RUN pnpm run pro:gen 
RUN pnpm run lens:gen 

# 构建应用程序
RUN pnpm run build

ENV LANG C.UTF-8

# 运行应用程序
CMD ["pnpm", "run", "start:prod"]
