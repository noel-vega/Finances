output "primary_endpoint_address" {
  value = aws_elasticache_cluster.this.cache_nodes[0].address
}

output "cluster_id" {
  value = aws_elasticache_cluster.this.cluster_id
}

output "port" {
  value = aws_elasticache_cluster.this.port
}
