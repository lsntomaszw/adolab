package dev.adolab.config;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.*;

public class StringArrayTypeHandler extends BaseTypeHandler<String[]> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, String[] parameter, JdbcType jdbcType) throws SQLException {
        Array array = ps.getConnection().createArrayOf("TEXT", parameter);
        ps.setArray(i, array);
    }

    @Override
    public String[] getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return toStringArray(rs.getArray(columnName));
    }

    @Override
    public String[] getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return toStringArray(rs.getArray(columnIndex));
    }

    @Override
    public String[] getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return toStringArray(cs.getArray(columnIndex));
    }

    private String[] toStringArray(Array array) throws SQLException {
        if (array == null) return null;
        Object[] objects = (Object[]) array.getArray();
        String[] result = new String[objects.length];
        for (int i = 0; i < objects.length; i++) {
            result[i] = objects[i] != null ? objects[i].toString() : null;
        }
        return result;
    }
}
