package com.example.learningplatform.service;

import java.util.List;
import java.util.Optional;

public interface BaseService<T, ID> {
    
    T save(T entity);
    
    Optional<T> findById(ID id);
    
    List<T> findAll();
    
    T update(T entity);
    
    void deleteById(ID id);
    
    boolean existsById(ID id);
    
    long count();
}