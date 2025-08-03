#!/bin/bash

NETWORK_NAME="mockprinters_net"
SUBNET="192.168.100.0/24"
GATEWAY="192.168.100.1"
IMAGE_NAME="mock-printer-image"
START_IP=2
END_IP=10
PORT_BASE=8000

# Cria rede docker se não existir
if ! docker network inspect $NETWORK_NAME >/dev/null 2>&1; then
  docker network create \
    --driver=bridge \
    --subnet=$SUBNET \
    --gateway=$GATEWAY \
    $NETWORK_NAME
fi

# Para e remove containers existentes
for i in $(seq $START_IP $END_IP); do
  CONTAINER_NAME="printer$i"
  if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    docker stop $CONTAINER_NAME
    docker rm $CONTAINER_NAME
  fi
done

# Roda os containers com IP fixo e portas mapeadas
for i in $(seq $START_IP $END_IP); do
  CONTAINER_NAME="printer$i"
  IP_ADDR="192.168.100.$i"
  PORT=$((PORT_BASE + i))

  docker run -d \
    --name $CONTAINER_NAME \
    --net $NETWORK_NAME \
    --ip $IP_ADDR \
    -e PRINTER_ID=$CONTAINER_NAME \
    -p $PORT:3000 \
    $IMAGE_NAME
done
