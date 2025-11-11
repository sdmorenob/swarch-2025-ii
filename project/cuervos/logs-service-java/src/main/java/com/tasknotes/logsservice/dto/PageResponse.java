package com.tasknotes.logsservice.dto;

import java.util.List;

public class PageResponse<T> {
    private List<T> items;
    private long total;
    private int page;
    private int size;
    private int pages;

    public PageResponse() {}

    public PageResponse(List<T> items, long total, int page, int size) {
        this.items = items;
        this.total = total;
        this.page = page;
        this.size = size;
        this.pages = (int) Math.ceil(total / (double) size);
    }

    public List<T> getItems() { return items; }
    public long getTotal() { return total; }
    public int getPage() { return page; }
    public int getSize() { return size; }
    public int getPages() { return pages; }

    public void setItems(List<T> items) { this.items = items; }
    public void setTotal(long total) { this.total = total; }
    public void setPage(int page) { this.page = page; }
    public void setSize(int size) { this.size = size; }
    public void setPages(int pages) { this.pages = pages; }
}